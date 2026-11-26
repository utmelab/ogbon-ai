import { neon } from '@neondatabase/serverless'

export type DbEnv = {
  NEON_DB_URL?: string
}

let inited = false

export async function getDb(env: DbEnv) {
  const url = env.NEON_DB_URL
  if (!url) throw new Error('Missing NEON_DB_URL')
  const sql = neon(url)

  if (!inited) {
    await sql`CREATE TABLE IF NOT EXISTS access_requests (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      market TEXT NOT NULL,
      experience TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    await sql`CREATE TABLE IF NOT EXISTS login_attempts (
      id BIGSERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'signin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    await sql`CREATE TABLE IF NOT EXISTS payment_proofs (
      id BIGSERIAL PRIMARY KEY,
      email TEXT,
      file_name TEXT NOT NULL,
      file_key TEXT NOT NULL,
      content_type TEXT,
      size_bytes INTEGER,
      status TEXT NOT NULL DEFAULT 'received',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`
    inited = true
  }

  return sql
}
