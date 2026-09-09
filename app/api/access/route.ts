import { env } from 'cloudflare:workers';

import { createAccessToken } from '@/lib/access';

export const runtime = 'edge';

export async function POST(request: Request) {
  const body = await request.json() as { email?: string };
  const email = body.email?.trim().toLowerCase() ?? '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'Enter the email used at checkout.' }, { status: 400 });

  if (env.ASSESSMENT_SIGNING_SECRET) {
    const purchase = await env.DB.prepare("SELECT id FROM purchases WHERE email = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 1").bind(email).first();
    if (!purchase) return Response.json({ error: 'We could not find a completed purchase for this email yet. Check the address or wait a moment and try again.' }, { status: 403 });
  }
  return Response.json({ accessToken: await createAccessToken(email) });
}
