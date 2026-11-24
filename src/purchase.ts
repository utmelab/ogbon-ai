import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

const email = sessionStorage.getItem('ogbon_request_email') || ''
const USD_AMOUNT = 1500
const WALLET = '1N4SLz7EpW8hkSRpyp7J8eG5mo7yUjKMeQ'

app.innerHTML = `
<div class="pay">
  <div class="pay__bg" aria-hidden="true"></div>
  <header class="pay__top">
    <a class="brand" href="/" aria-label="ỌGBỌN — home">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
    </a>
    <a class="access__back" href="/request.html">Back</a>
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

overlayClose?.addEventListener('click', hideOverlay)
pay?.addEventListener('click', () => {
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
    setOverlay('No payment received.', 'We could not confirm your transfer. Check the address and amount, then try again.', true)
  }, 1400)
})

loadBtcAmount()
