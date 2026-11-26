const fromEnv = (value: unknown, fallback: string) => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text || fallback
}

export const INVITE_CODE = fromEnv(import.meta.env.VITE_INVITE_CODE, 'OGBN2026').toUpperCase()
export const BTC_WALLET = fromEnv(
  import.meta.env.VITE_BTC_WALLET,
  '1N4SLz7EpW8hkSRpyp7J8eG5mo7yUjKMeQ',
)

export const PAYMENT_USD_AMOUNT = (() => {
  const raw = fromEnv(import.meta.env.VITE_PAYMENT_USD_AMOUNT, '')
  const amount = Number(raw)
  return Number.isFinite(amount) && amount > 0 ? amount : 1500
})()
