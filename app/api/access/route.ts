import { createAccessToken } from '@/lib/access';
import { blobIsConfigured, hasPaidPurchase } from '@/lib/blob-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'Enter the email used at checkout.' }, { status: 400 });

  if (process.env.NODE_ENV === 'production' && !process.env.ASSESSMENT_SIGNING_SECRET) {
    return Response.json({ error: 'Paid assessment access is not configured yet.' }, { status: 503 });
  }
  if (process.env.NODE_ENV === 'production' && !blobIsConfigured()) {
    return Response.json({ error: 'Purchase verification is not configured yet.' }, { status: 503 });
  }
  if (process.env.ASSESSMENT_SIGNING_SECRET && blobIsConfigured() && !await hasPaidPurchase(email)) {
    return Response.json({ error: 'We could not find a completed purchase for this email yet. Check the address or wait a moment and try again.' }, { status: 403 });
  }
  return Response.json({ accessToken: await createAccessToken(email) });
}
