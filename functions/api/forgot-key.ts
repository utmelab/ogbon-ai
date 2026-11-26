import { getDb } from '../_lib/db'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const email = String(body.email || '').trim().toLowerCase()
  if (!email) {
    return json({ ok: false, error: 'Email is required.' }, 400)
  }

  try {
    const sql = await getDb(env)
    await sql`INSERT INTO login_attempts (email, mode) VALUES (${email}, ${'forgot'})`
  } catch (err) {
    console.error('forgot db error', err)
  }

  return json({ ok: false, error: 'This email is not registered in the system.' }, 404)
}
