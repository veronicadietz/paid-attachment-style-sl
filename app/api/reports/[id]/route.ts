import { readAssessment, readPrivateBlob, sha256 } from '@/lib/blob-store';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return new Response('This download link is incomplete.', { status: 401 });

  const record = await readAssessment(id);
  if (!record || record.downloadTokenHash !== await sha256(token)) return new Response('This report link is not valid.', { status: 404 });
  if (Date.now() > record.downloadExpiresAt) return new Response('This secure download link has expired. Please contact Securely Loved for a fresh copy.', { status: 410 });

  const result = await readPrivateBlob(record.reportPath);
  if (!result || result.statusCode !== 200) return new Response('The report could not be found.', { status: 404 });
  const filename = `${record.firstName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-attachment-profile.pdf`;
  return new Response(result.stream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
