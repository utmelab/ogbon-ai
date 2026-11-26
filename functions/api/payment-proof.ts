import { getDb } from '../_lib/db'
import { uploadProof } from '../_lib/storage'
import { sendProofNotification } from '../_lib/mail'

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })

export const onRequestPost = async ({ request, env }: { request: Request; env: any }) => {
  try {
    const form = await request.formData()
    const email = String(form.get('email') || '').trim().toLowerCase()
    const file = form.get('proof')

    if (!(file instanceof File) || !file.size) {
      return json({ ok: false, error: 'Proof image is required.' }, 400)
    }
    if (!file.type.startsWith('image/')) {
      return json({ ok: false, error: 'Only image files are allowed.' }, 400)
    }

    const uploaded = await uploadProof(env, file, email)
    const sql = await getDb(env)
    await sql`INSERT INTO payment_proofs (email, file_name, file_key, content_type, size_bytes, status)
      VALUES (${email || null}, ${file.name}, ${uploaded.key}, ${file.type || null}, ${file.size}, ${'received'})`

    let emailSent = false
    try {
      const mail = await sendProofNotification(env, {
        email,
        fileName: file.name,
        fileKey: uploaded.key,
        sizeBytes: file.size,
      })
      emailSent = mail.sent
    } catch (err) {
      console.error('proof notification error', err)
    }

    return json({
      ok: true,
      message: 'Proof received. We will review it after payment confirmation.',
      emailSent,
    })
  } catch (err) {
    console.error('payment-proof error', err)
    return json({ ok: false, error: 'Could not upload proof right now.' }, 500)
  }
}
