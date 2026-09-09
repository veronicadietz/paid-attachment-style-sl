import { blobIsConfigured, savePurchase } from '@/lib/blob-store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const secret = process.env.IVOREY_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-ivorey-secret') !== secret) {
    return Response.json({ error: 'Unauthorized webhook.' }, { status: 401 });
  }
  if (!blobIsConfigured()) return Response.json({ error: 'Vercel Blob is not configured.' }, { status: 503 });

  const body = await request.json() as { orderId?: string; email?: string; firstName?: string; contactId?: string; productName?: string; amountCents?: number | string };
  const email = body.email?.trim().toLowerCase() ?? '';
  const orderId = body.orderId?.trim() ?? '';
  if (!orderId || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'orderId and email are required.' }, { status: 400 });
  const amount = Number(body.amountCents ?? 4700);

  await savePurchase({
    id: crypto.randomUUID(),
    orderId,
    firstName: body.firstName?.trim().slice(0, 80) || 'Customer',
    email,
    ivoreyContactId: body.contactId ?? null,
    productName: body.productName?.trim() || 'Personalized Attachment Profile',
    amountCents: Number.isFinite(amount) ? amount : 4700,
    status: 'paid',
    createdAt: new Date().toISOString(),
  });

  return Response.json({ received: true }, { status: 201 });
}
