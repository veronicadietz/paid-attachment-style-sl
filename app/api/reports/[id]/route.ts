import { env } from 'cloudflare:workers';

export const runtime = 'edge';

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return new Response('This download link is incomplete.', { status: 401 });

  const record = await env.DB.prepare('SELECT first_name, report_key, download_token_hash, download_expires_at FROM assessments WHERE id = ?').bind(id).first<{
    first_name: string; report_key: string; download_token_hash: string; download_expires_at: number;
  }>();
  if (!record || record.download_token_hash !== await sha256(token)) return new Response('This report link is not valid.', { status: 404 });
  if (Date.now() > record.download_expires_at) return new Response('This secure download link has expired. Please contact Securely Loved for a fresh copy.', { status: 410 });

  const object = await env.FILES.get(record.report_key);
  if (!object) return new Response('The report could not be found.', { status: 404 });
  const filename = `${record.first_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-attachment-profile.pdf`;
  return new Response(object.body, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'private, no-store' } });
}
