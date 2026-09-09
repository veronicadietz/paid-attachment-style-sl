import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { scoreAssessment } from '@/lib/assessment';
import { verifyAccessToken } from '@/lib/access';
import { blobIsConfigured, saveAssessment, saveReport, sha256 } from '@/lib/blob-store';
import { createAttachmentReport } from '@/lib/report';

export const runtime = 'nodejs';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json() as { firstName?: string; email?: string; answers?: number[]; ivoreyContactId?: string; accessToken?: string };
    const firstName = body.firstName?.trim().slice(0, 80) ?? '';
    const email = body.email?.trim().toLowerCase().slice(0, 254) ?? '';
    if (!firstName || !emailPattern.test(email) || !Array.isArray(body.answers)) {
      return Response.json({ error: 'Please provide a valid first name, email, and all assessment answers.' }, { status: 400 });
    }
    if (!await verifyAccessToken(email, body.accessToken)) {
      return Response.json({ error: 'Your paid assessment access has expired. Please return through your purchase email.' }, { status: 403 });
    }
    if (!blobIsConfigured()) {
      return Response.json({ error: 'Report storage is not configured yet.' }, { status: 503 });
    }

    const scores = scoreAssessment(body.answers);
    const id = crypto.randomUUID();
    const downloadToken = `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll('-', '');
    const downloadTokenHash = await sha256(downloadToken);
    const createdAt = new Date();
    const downloadExpiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    const logoBytes = new Uint8Array(await readFile(join(process.cwd(), 'public', 'securely-loved-logo.png')));
    const pdf = await createAttachmentReport({ firstName, completedAt: createdAt.toISOString(), scores, logoBytes });
    const reportPath = `reports/${createdAt.getUTCFullYear()}/${id}.pdf`;

    await saveReport(reportPath, pdf);
    await saveAssessment({
      id,
      firstName,
      email,
      ivoreyContactId: body.ivoreyContactId ?? null,
      reportPath,
      downloadTokenHash,
      downloadExpiresAt: downloadExpiresAt.getTime(),
      createdAt: createdAt.toISOString(),
    });

    const downloadUrl = `${new URL(request.url).origin}/api/reports/${id}?token=${downloadToken}`;
    let deliveryStatus = 'not_configured';
    if (process.env.IVOREY_RESULT_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.IVOREY_RESULT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'attachment_profile.completed',
            assessmentId: id,
            firstName,
            email,
            ivoreyContactId: body.ivoreyContactId ?? null,
            primaryStyle: scores.primary,
            secondaryStyle: scores.secondary,
            isBlend: scores.isBlend,
            reportUrl: downloadUrl,
            completedAt: createdAt.toISOString(),
          }),
        });
        deliveryStatus = response.ok ? 'sent_to_ivorey' : 'failed';
      } catch (error) {
        deliveryStatus = 'failed';
        console.error('Ivorey result webhook failed', error);
      }
    }

    return Response.json({ id, scores, downloadUrl, emailStatus: deliveryStatus });
  } catch (error) {
    console.error('Assessment submission failed', error);
    return Response.json({ error: error instanceof Error ? error.message : 'We could not create the report. Please try again.' }, { status: 500 });
  }
}
