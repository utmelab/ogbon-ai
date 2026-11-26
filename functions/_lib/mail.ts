type MailEnv = {
  RESEND_API_KEY?: string
  RESEND_FROM?: string
  RESEND_TO?: string
}

export async function sendProofNotification(env: MailEnv, input: {
  email: string
  fileName: string
  fileKey: string
  sizeBytes: number
}) {
  const apiKey = env.RESEND_API_KEY
  const from = env.RESEND_FROM || 'ỌGBỌN <onboarding@resend.dev>'
  const to = env.RESEND_TO
  if (!apiKey || !to) {
    console.warn('Resend not configured; skipping proof notification')
    return { sent: false, skipped: true }
  }

  const subject = `New payment proof uploaded${input.email ? ` — ${input.email}` : ''}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 12px">New payment proof uploaded</h2>
      <p style="margin:0 0 8px"><strong>Email:</strong> ${escapeHtml(input.email || 'Not provided')}</p>
      <p style="margin:0 0 8px"><strong>File:</strong> ${escapeHtml(input.fileName)}</p>
      <p style="margin:0 0 8px"><strong>Storage key:</strong> ${escapeHtml(input.fileKey)}</p>
      <p style="margin:0 0 8px"><strong>Size:</strong> ${Math.max(1, Math.round(input.sizeBytes / 1024))} KB</p>
    </div>
  `

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Resend failed: ${res.status} ${text}`.slice(0, 200))
  }

  return { sent: true, skipped: false }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
