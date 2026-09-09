function encode(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function decode(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return new TextDecoder().decode(Uint8Array.from(atob(normalized), (character) => character.charCodeAt(0)));
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return encode(String.fromCharCode(...new Uint8Array(signature)));
}

export async function createAccessToken(email: string) {
  const secret = process.env.ASSESSMENT_SIGNING_SECRET;
  if (!secret) return 'local-demo-access';
  const payload = encode(JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + 12 * 60 * 60 * 1000 }));
  return `${payload}.${await sign(payload, secret)}`;
}

export async function verifyAccessToken(email: string, token?: string) {
  const secret = process.env.ASSESSMENT_SIGNING_SECRET;
  if (!secret) return true;
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature || signature !== await sign(payload, secret)) return false;
  try {
    const data = JSON.parse(decode(payload)) as { email: string; exp: number };
    return data.email === email.toLowerCase() && data.exp > Date.now();
  } catch {
    return false;
  }
}
