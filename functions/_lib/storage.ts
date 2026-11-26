import { AwsClient } from 'aws4fetch'

export type StorageEnv = {
  AWS_ENDPOINT_URL_S3?: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
  AWS_REGION?: string
  AWS_BUCKET_NAME?: string
}

function getBucket(env: StorageEnv) {
  return env.AWS_BUCKET_NAME || 'ogbon-proofs'
}

function getClient(env: StorageEnv) {
  const accessKeyId = env.AWS_ACCESS_KEY_ID
  const secretAccessKey = env.AWS_SECRET_ACCESS_KEY
  const region = env.AWS_REGION || 'us-east-2'
  if (!accessKeyId || !secretAccessKey) throw new Error('Missing storage credentials')
  return new AwsClient({ accessKeyId, secretAccessKey, region, service: 's3' })
}

async function ensureBucket(env: StorageEnv) {
  const endpoint = env.AWS_ENDPOINT_URL_S3
  if (!endpoint) throw new Error('Missing AWS_ENDPOINT_URL_S3')
  const bucket = getBucket(env)
  const client = getClient(env)
  // Best effort: create bucket if not exists. S3-compatible services may return 409/200.
  await client.fetch(`${endpoint.replace(/\/$/, '')}/${bucket}`, { method: 'PUT' }).catch(() => null)
  return { client, endpoint: endpoint.replace(/\/$/, ''), bucket }
}

export async function uploadProof(env: StorageEnv, file: File, email: string) {
  const { client, endpoint, bucket } = await ensureBucket(env)
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'proof'
  const key = `proofs/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`
  const url = `${endpoint}/${bucket}/${key}`
  const body = await file.arrayBuffer()
  const res = await client.fetch(url, {
    method: 'PUT',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    body,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Upload failed: ${res.status} ${text}`.slice(0, 200))
  }
  return { key, bucket }
}
