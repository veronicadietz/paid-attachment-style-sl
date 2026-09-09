import { env } from 'cloudflare:workers';

import { scoreAssessment } from '@/lib/assessment';
import { verifyAccessToken } from '@/lib/access';
import { createAttachmentReport } from '@/lib/report';

export const runtime = 'edge';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  return btoa(binary);
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sendDeliveryEmail(email: string, firstName: string, pdf: Uint8Array, downloadUrl: string) {
  if (!env.RESEND_API_KEY) return 'not_configured';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Securely Loved <bev@securelyloved.com>',
      to: [email],
      subject: `${firstName}, your Personalized Attachment Profile is ready`,
      html: `<p>Hi ${firstName},</p><p>Your Personalized Attachment Profile is ready. A copy is attached, and you can also <a href="${downloadUrl}">download it securely here</a> for the next seven days.</p><p>Please save the report somewhere private where you can return to it.</p><p>With care,<br>Bev<br>Securely Loved</p>`,
      attachments: [{ filename: 'personalized-attachment-profile.pdf', content: bytesToBase64(pdf) }],
    }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}.`);
  return 'sent';
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { firstName?: string; email?: string; answers?: number[]; ivoreyContactId?: string; accessToken?: string };
    const firstName = body.firstName?.trim().slice(0, 80) ?? '';
    const email = body.email?.trim().toLowerCase().slice(0, 254) ?? '';
    if (!firstName || !emailPattern.test(email) || !Array.isArray(body.answers)) {
      return Response.json({ error: 'Please provide a valid first name, email, and all assessment answers.' }, { status: 400 });
    }
    if (!await verifyAccessToken(email, body.accessToken)) return Response.json({ error: 'Your paid assessment access has expired. Please return through your purchase email.' }, { status: 403 });

    const scores = scoreAssessment(body.answers);
    const id = crypto.randomUUID();
    const downloadToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
    const downloadTokenHash = await sha256(downloadToken);
    const createdAt = new Date();
    const downloadExpiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const logoResponse = await fetch(new URL('/securely-loved-logo.png', request.url));
    const logoBytes = logoResponse.ok ? new Uint8Array(await logoResponse.arrayBuffer()) : undefined;
    const pdf = await createAttachmentReport({ firstName, completedAt: createdAt.toISOString(), scores, logoBytes });
    const reportKey = `reports/${createdAt.getUTCFullYear()}/${id}.pdf`;
    await env.FILES.put(reportKey, pdf, { httpMetadata: { contentType: 'application/pdf' } });

    await env.DB.prepare(`INSERT INTO assessments (
      id, first_name, email, ivorey_contact_id, answers_json, scores_json,
      primary_style, secondary_style, is_blend, report_key, download_token_hash,
      download_expires_at, email_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, firstName, email, body.ivoreyContactId ?? null, JSON.stringify(body.answers), JSON.stringify(scores), scores.primary, scores.secondary, scores.isBlend ? 1 : 0, reportKey, downloadTokenHash, downloadExpiresAt.getTime(), 'pending', createdAt.getTime())
      .run();

    const downloadUrl = `${new URL(request.url).origin}/api/reports/${id}?token=${downloadToken}`;
    let emailStatus = 'not_configured';
    try {
      emailStatus = await sendDeliveryEmail(email, firstName, pdf, downloadUrl);
    } catch (error) {
      emailStatus = 'failed';
      console.error('Delivery email failed', error);
    }
    await env.DB.prepare('UPDATE assessments SET email_status = ? WHERE id = ?').bind(emailStatus, id).run();

    if (env.IVOREY_RESULT_WEBHOOK_URL) {
      try {
        await fetch(env.IVOREY_RESULT_WEBHOOK_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'attachment_profile.completed', assessmentId: id, firstName, email, ivoreyContactId: body.ivoreyContactId ?? null, primaryStyle: scores.primary, secondaryStyle: scores.secondary, isBlend: scores.isBlend, reportUrl: downloadUrl, completedAt: createdAt.toISOString() }),
        });
      } catch (error) {
        console.error('Ivorey result webhook failed', error);
      }
    }

    return Response.json({ id, scores, downloadUrl, emailStatus });
  } catch (error) {
    console.error('Assessment submission failed', error);
    return Response.json({ error: error instanceof Error ? error.message : 'We could not create the report. Please try again.' }, { status: 500 });
  }
}
