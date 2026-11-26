import { getDb } from '../_lib/db'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  let body: { name?: string; email?: string; market?: string; experience?: string }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const market = String(body.market || '').trim()
  const experience = String(body.experience || '').trim()
  if (!name || !email || !market || !experience) {
    return json({ ok: false, error: 'All fields are required.' }, 400)
  }

  try {
    const sql = await getDb(env)
    await sql`INSERT INTO access_requests (name, email, market, experience) VALUES (${name}, ${email}, ${market}, ${experience})`
  } catch (err) {
    console.error('request-access db error', err)
  }

  return json({ ok: true, message: 'Request received.', next: '/purchase.html' })
}
