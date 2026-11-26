const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestPost= async ({ request }: { request: Request }) => {
  let body: { email?: string; amountUsd?: number }
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400)
  }

  const email = String(body.email || '').trim().toLowerCase()
  if (!email) {
    return json({ ok: false, error: 'Email is required.' }, 400)
  }

  return json({
    ok: false,
    error: 'Payment failed. No payment was received.',
  }, 402)
}
