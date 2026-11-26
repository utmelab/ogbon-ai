import { getDb } from '../_lib/db'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  let body: { email?: string; key?: string }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const email = String(body.email || '').trim().toLowerCase()
  const key = String(body.key || '').trim()
  if (!email || !key) {
    return json({ ok: false, error: 'Email and access key are required.' }, 400)
  }

  try {
    const sql = await getDb(env)
    await sql`INSERT INTO login_attempts (email, mode) VALUES (${email}, ${'signin'})`
  } catch (err) {
    console.error('login db error', err)
  }

  return json({ ok: false, error: 'This email is not registered in the system.' }, 401)
}
