export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestGet= async () => {
  return json({ ok: true, service: 'ogbon-api', time: new Date().toISOString() })
}
