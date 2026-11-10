/* The password gate, shared by middleware.ts and api/login.ts.
 *
 * The password lives only in the SITE_PASSWORD setting on Vercel. Signing in
 * sets a cookie holding a code worked out from the password, never the
 * password itself. Changing the password signs every browser out. */

export const COOKIE = 'cca_gate'

const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')

/** The cookie's value for this password. */
export async function token(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('cca-prep-gate-v1')))
}

/** Compares two strings without stopping at the first difference. */
export function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export function cookie(request: Request, name: string): string {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return ''
}
