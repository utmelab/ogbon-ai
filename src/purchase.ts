import './style.css'
import { initLang, langMarkup } from './lang'
import { setFlow, getFlow } from './flow'
import { BTC_WALLET } from './config'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

const flow = getFlow()
const email = sessionStorage.getItem('ogbon_request_email') || flow?.email || ''
const USD_AMOUNT = 1500
const WALLET = BTC_WALLET
setFlow({ step: 'purchase', email })

app.innerHTML = `
<div class="pay">
  <div class="pay__bg" aria-hidden="true"></div>
  <header class="pay__top">
    <a class="brand" href="/" aria-label="ỌGBỌN — home">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
    </a>
    <div class="access__top-end">
      ${langMarkup}
      <a class="access__back" href="/request.html?reset=1">Back</a>
    </div>
  </header>

  <main class="pay__main">
    <section class="pay__card" aria-labelledby="pay-title">
      <div class="purchase__overlay" data-overlay aria-hidden="true">
        <div class="purchase__overlay-card" data-overlay-card>
          <div class="purchase__spinner" data-spinner aria-hidden="true"></div>
          <p class="purchase__overlay-k" data-overlay-k>Processing</p>
          <h2 class="purchase__overlay-title" data-overlay-title>Processing payment…</h2>
          <p class="purchase__overlay-sub" data-overlay-sub>Please ensure the payment has been made.</p>
          <button class="btn btn--primary purchase__overlay-btn" type="button" data-overlay-close>Try again</button>
        </div>
      </div>

      <div class="pay__head">
        <p class="pay__eyebrow">Node Access Payment</p>
        <h1 class="pay__amount" id="pay-title">$${USD_AMOUNT.toLocaleString()}.00</h1>
        <p class="pay__amount-sub">Amount payable</p>
        <p class="pay__intro">Pay $1,500 USD in Bitcoin to activate your private node. The exact BTC amount and address are below.</p>
      </div>

      <div class="pay__block">
        <div class="pay__block-head">
          <span>Send Bitcoin</span>
          <span class="pay__live" data-rate>Live rate</span>
        </div>
        <div class="pay__btc" data-btc-amount>0.00000000 BTC</div>
        <p class="pay__btc-note" data-hint>Calculating the exact BTC amount from the live rate.</p>
      </div>

      <div class="pay__block">
        <div class="pay__block-head">
          <span>Payment address</span>
        </div>
        <code class="pay__address" data-wallet>${WALLET}</code>
        <button class="purchase__copy pay__copy" type="button" data-copy>Copy address</button>
      </div>

      <div class="proof" data-proof>
        <div class="proof__head">
          <p class="pay__block-head"><span>Payment proof</span></p>
          <p class="proof__sub">Upload a screenshot of your Bitcoin transfer.</p>
        </div>
        <label class="proof__drop" data-drop>
          <input class="proof__input" type="file" accept="image/*" data-proof-input />
          <div class="proof__drop-inner">
            <strong data-proof-title>Choose image</strong>
            <span data-proof-meta>PNG, JPG, or WEBP</span>
          </div>
        </label>
        <div class="proof__preview" data-proof-preview hidden>
          <img alt="Payment proof preview" data-proof-img />
          <button class="proof__remove" type="button" data-proof-remove>Remove</button>
        </div>
        <p class="proof__status" role="status" aria-live="polite" data-proof-status></p>
      </div>

      <button class="btn btn--primary pay__submit" type="button" data-pay>
        <span>I have sent payment</span>
        <span class="btn__arrow" aria-hidden="true">→</span>
      </button>

      <p class="pay__fine">Send the exact BTC amount shown above. Access is granted after confirmation.${email ? ` Receipt: ${escapeHtml(email)}` : ''}</p>
    </section>
  </main>
</div>
`

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const pay = document.querySelector<HTMLButtonElement>('[data-pay]')
const overlay = document.querySelector<HTMLElement>('[data-overlay]')
const spinner = document.querySelector<HTMLElement>('[data-spinner]')
const overlayK = document.querySelector<HTMLElement>('[data-overlay-k]')
const overlayTitle = document.querySelector<HTMLElement>('[data-overlay-title]')
const overlaySub = document.querySelector<HTMLElement>('[data-overlay-sub]')
const overlayClose = document.querySelector<HTMLButtonElement>('[data-overlay-close]')
const copy = document.querySelector<HTMLButtonElement>('[data-copy]')
const wallet = document.querySelector<HTMLElement>('[data-wallet]')
const btcAmount = document.querySelector<HTMLElement>('[data-btc-amount]')
const hint = document.querySelector<HTMLElement>('[data-hint]')
const rate = document.querySelector<HTMLElement>('[data-rate]')
const proofInput = document.querySelector<HTMLInputElement>('[data-proof-input]')
const proofPreview = document.querySelector<HTMLElement>('[data-proof-preview]')
const proofImg = document.querySelector<HTMLImageElement>('[data-proof-img]')
const proofRemove = document.querySelector<HTMLButtonElement>('[data-proof-remove]')
const proofStatus = document.querySelector<HTMLElement>('[data-proof-status]')
const proofTitle = document.querySelector<HTMLElement>('[data-proof-title]')
const proofMeta = document.querySelector<HTMLElement>('[data-proof-meta]')
const proofSection = document.querySelector<HTMLElement>('[data-proof]')

copy?.addEventListener('click', async () => {
  const text = wallet?.textContent?.trim() || ''
  try {
    await navigator.clipboard.writeText(text)
    if (copy) copy.textContent = 'Copied'
    setTimeout(() => { if (copy) copy.textContent = 'Copy address' }, 1400)
  } catch {
    if (copy) copy.textContent = 'Copy failed'
    setTimeout(() => { if (copy) copy.textContent = 'Copy address' }, 1400)
  }
})

async function getBtcUsd() {
  const endpoints: Array<() => Promise<number>> = [
    async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error('bad')
      const data = await res.json() as { bitcoin?: { usd?: number } }
      const usd = data?.bitcoin?.usd
      if (!usd || !Number.isFinite(usd)) throw new Error('bad')
      return usd
    },
    async () => {
      const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', { headers: { accept: 'application/json' } })
      if (!res.ok) throw new Error('bad')
      const data = await res.json() as { data?: { amount?: string } }
      const usd = Number(data?.data?.amount)
      if (!usd || !Number.isFinite(usd)) throw new Error('bad')
      return usd
    },
  ]
  for (const load of endpoints) {
    try { return await load() } catch {}
  }
  throw new Error('unavailable')
}

async function loadBtcAmount() {
  try {
    const usd = await getBtcUsd()
    const btc = (USD_AMOUNT / usd).toFixed(8)
    if (btcAmount) btcAmount.textContent = `${btc} BTC`
    if (rate) rate.textContent = `1 BTC = $${usd.toLocaleString()}`
    if (hint) hint.textContent = `Send exactly ${btc} BTC. Rate updates on refresh.`
  } catch {
    if (btcAmount) btcAmount.textContent = 'Rate unavailable'
    if (rate) rate.textContent = 'Unavailable'
    if (hint) hint.textContent = 'Could not fetch live rate. Refresh to try again.'
  }
}

function showOverlay() {
  overlay?.classList.add('is-visible')
  overlay?.setAttribute('aria-hidden', 'false')
}
function hideOverlay() {
  overlay?.classList.remove('is-visible', 'is-error')
  overlay?.setAttribute('aria-hidden', 'true')
}
function setOverlay(message: string, sub: string, error = false) {
  if (overlayTitle) overlayTitle.textContent = message
  if (overlaySub) overlaySub.textContent = sub
  if (overlayK) overlayK.textContent = error ? 'Payment failed' : 'Processing'
  overlay?.classList.toggle('is-error', error)
  if (spinner) spinner.style.display = error ? 'none' : ''
  if (overlayClose) overlayClose.style.display = error ? 'inline-flex' : 'none'
}

let proofFile: File | null = null

proofInput?.addEventListener('change', () => {
  const file = proofInput.files?.[0] || null
  proofFile = file
  if (!file || !proofPreview || !proofImg) {
    if (proofPreview) proofPreview.hidden = true
    return
  }
  proofImg.src = URL.createObjectURL(file)
  proofPreview.hidden = false
  if (proofTitle) proofTitle.textContent = file.name
  if (proofMeta) proofMeta.textContent = `${Math.max(1, Math.round(file.size / 1024))} KB`
  if (proofStatus) { proofStatus.textContent = 'Proof ready to submit.'; proofStatus.dataset.tone = 'muted' }
})

proofRemove?.addEventListener('click', () => {
  if (proofInput) proofInput.value = ''
  if (proofPreview) proofPreview.hidden = true
  if (proofImg) proofImg.src = ''
  if (proofTitle) proofTitle.textContent = 'Choose image'
  if (proofMeta) proofMeta.textContent = 'PNG, JPG, or WEBP'
  if (proofStatus) { proofStatus.textContent = ''; proofStatus.dataset.tone = ''; }
})

overlayClose?.addEventListener('click', () => {
  hideOverlay()
  proofSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})
pay?.addEventListener('click', async () => {
  if (!proofFile) {
    if (proofStatus) {
      proofStatus.textContent = 'Upload payment proof before continuing.'
      proofStatus.dataset.tone = 'alert'
    }
    proofSection?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  pay.disabled = true
  pay.style.opacity = '0.7'
  if (proofStatus) { proofStatus.textContent = 'Submitting proof…'; proofStatus.dataset.tone = 'muted' }

  try {
    const form = new FormData()
    form.append('email', email)
    form.append('proof', proofFile)
    const res = await fetch('/api/payment-proof', { method: 'POST', body: form })
    const data = await res.json().catch(() => null) as { ok?: boolean; error?: string; message?: string } | null
    if (!res.ok || !data?.ok) throw new Error(data?.error || 'Could not upload proof.')
    if (proofStatus) { proofStatus.textContent = 'Proof submitted.'; proofStatus.dataset.tone = 'ok' }
  } catch (err) {
    if (proofStatus) {
      proofStatus.textContent = err instanceof Error ? err.message : 'Could not upload proof.'
      proofStatus.dataset.tone = 'alert'
    }
    pay.disabled = false
    pay.style.opacity = ''
    return
  }

  showOverlay()
  setOverlay('Processing payment…', 'Please ensure the payment has been made.')
  const steps = [
    ['Processing payment…', 'Please ensure the payment has been made.'],
    ['Confirming transaction…', 'Checking the network for your transfer.'],
    ['Still checking…', 'This can take a moment.'],
  ] as const
  let i = 0
  const timer = window.setInterval(() => {
    i += 1
    if (i < steps.length) {
      setOverlay(steps[i][0], steps[i][1])
      return
    }
    window.clearInterval(timer)
    setOverlay('No payment received.', 'No transfer found yet. We have your proof and will keep checking.', true)
    pay.disabled = false
    pay.style.opacity = ''
  }, 1400)
})

loadBtcAmount()

initLang()
