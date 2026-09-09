import { get, list, put } from '@vercel/blob';

export type PurchaseRecord = {
  id: string;
  orderId: string;
  firstName: string;
  email: string;
  ivoreyContactId: string | null;
  productName: string;
  amountCents: number;
  status: 'paid';
  createdAt: string;
};

export type AssessmentRecord = {
  id: string;
  firstName: string;
  email: string;
  ivoreyContactId: string | null;
  reportPath: string;
  downloadTokenHash: string;
  downloadExpiresAt: number;
  createdAt: string;
};

export function blobIsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN);
}

export async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function savePurchase(record: PurchaseRecord) {
  const emailHash = await sha256(record.email);
  const orderHash = await sha256(record.orderId);
  await put(`purchases/${emailHash}/${orderHash}.json`, JSON.stringify(record), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: true,
  });
}

export async function hasPaidPurchase(email: string) {
  const emailHash = await sha256(email);
  const result = await list({ prefix: `purchases/${emailHash}/`, limit: 1 });
  return result.blobs.length > 0;
}

export async function saveReport(pathname: string, pdf: Uint8Array) {
  await put(pathname, Buffer.from(pdf), {
    access: 'private',
    contentType: 'application/pdf',
  });
}

export async function saveAssessment(record: AssessmentRecord) {
  await put(`assessments/${record.id}.json`, JSON.stringify(record), {
    access: 'private',
    contentType: 'application/json',
  });
}

export async function readAssessment(id: string) {
  const result = await get(`assessments/${id}.json`, { access: 'private' });
  if (!result || result.statusCode !== 200) return null;
  return new Response(result.stream).json() as Promise<AssessmentRecord>;
}

export async function readPrivateBlob(pathname: string) {
  return get(pathname, { access: 'private' });
}
