export type FlowState = {
  step: 'access' | 'request' | 'purchase'
  name?: string
  email?: string
  market?: string
  experience?: string
}

const KEY = 'ogbon_flow'

export function getFlow(): FlowState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as FlowState : null
  } catch {
    return null
  }
}

export function setFlow(patch: Partial<FlowState>) {
  const prev = getFlow() || { step: 'access' as const }
  const next = { ...prev, ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearFlow() {
  localStorage.removeItem(KEY)
}
