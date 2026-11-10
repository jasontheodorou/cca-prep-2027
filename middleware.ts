import { next } from '@vercel/functions'
import { COOKIE, cookie, same, token } from './api/_gate.js'

/* Runs on Vercel before every page, file and API call. Nothing is served
 * without the gate's cookie, except the sign-in page and its form. The local
 * dev server does not run this. */

const OPEN = new Set(['/login', '/login.html', '/api/login'])

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  if (OPEN.has(url.pathname)) return next()

  const password = process.env.SITE_PASSWORD
  if (!password) return new Response('The password for this site is not set up yet.', { status: 503 })

  if (same(cookie(request, COOKIE), await token(password))) return next()

  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return Response.json({ error: 'Sign in first' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
  return new Response(null, { status: 302, headers: { Location: '/login', 'Cache-Control': 'no-store' } })
}
