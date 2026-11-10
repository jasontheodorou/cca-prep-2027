import { COOKIE, same, token } from './_gate.js'

/* POST /api/login, from the form on the sign-in page. A right password sets
 * the gate's cookie for a year and goes to the site. A wrong one waits a
 * second, to slow down guessing, and goes back to the form. */

const back = (to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: to, 'Cache-Control': 'no-store', ...headers } })

export async function POST(request: Request) {
  const password = process.env.SITE_PASSWORD
  if (!password) return new Response('The password for this site is not set up yet.', { status: 503 })

  const form = await request.formData().catch(() => null)
  const given = String(form?.get('password') ?? '')
  // Compare the codes, so the time taken says nothing about the password.
  if (!given || !same(await token(given), await token(password))) {
    await new Promise((r) => setTimeout(r, 1000))
    return back('/login?wrong=1')
  }
  return back('/', {
    'Set-Cookie': `${COOKIE}=${await token(password)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=31536000`,
  })
}

export const GET = () => back('/login')
