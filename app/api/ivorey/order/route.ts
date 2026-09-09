import { env } from 'cloudflare:workers';

export const runtime = 'edge';

export async function POST(request: Request) {
  if (!env.IVOREY_WEBHOOK_SECRET || request.headers.get('x-ivorey-secret') !== env.IVOREY_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized webhook.' }, { status: 401 });
  }
  const body = await request.json() as { orderId?: string; email?: string; firstName?: string; contactId?: string; productName?: string; amountCents?: number | string };
  const email = body.email?.trim().toLowerCase() ?? '';
  const orderId = body.orderId?.trim() ?? '';
  if (!orderId || !/^\S+@\S+\.\S+$/.test(email)) return Response.json({ error: 'orderId and email are required.' }, { status: 400 });
  const amount = Number(body.amountCents ?? 4700);
  await env.DB.prepare(`INSERT INTO purchases (id, order_id, first_name, email, ivorey_contact_id, product_name, amount_cents, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)
    ON CONFLICT(order_id) DO UPDATE SET status = 'paid', email = excluded.email, ivorey_contact_id = excluded.ivorey_contact_id`)
    .bind(crypto.randomUUID(), orderId, body.firstName?.trim().slice(0, 80) || 'Customer', email, body.contactId ?? null, body.productName?.trim() || 'Personalized Attachment Profile', Number.isFinite(amount) ? amount : 4700, Date.now())
    .run();
  return Response.json({ received: true }, { status: 201 });
}
