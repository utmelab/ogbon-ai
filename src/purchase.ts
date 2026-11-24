import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

const email = sessionStorage.getItem('ogbon_request_email') || 'your email'
const name = sessionStorage.getItem('ogbon_request_name') || 'there'

app.innerHTML = `
<div class="access">
  <div class="access__bg" aria-hidden="true"></div>
  <header class="access__top">
    <a class="brand" href="/" aria-label="ỌGBỌN — home">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
      <span class="brand__slash" aria-hidden="true">/</span>
      <span class="brand__desc">Welcome</span>
    </a>
    <a class="access__back" href="/request.html">Back</a>
  </header>

  <main class="access__main access__main--single">
    <section class="access__card purchase" aria-labelledby="purchase-title">
      <div class="purchase__overlay" data-overlay aria-hidden="true">
        <div class="purchase__overlay-card" data-overlay-card>
          <div class="purchase__spinner" data-spinner aria-hidden="true"></div>
          <p class="purchase__overlay-k" data-overlay-k>Processing</p>
          <h2 class="purchase__overlay-title" data-overlay-title>Processing payment…</h2>
          <p class="purchase__overlay-sub" data-overlay-sub>Please ensure the payment has been made.</p>
          <button class="btn btn--primary purchase__overlay-btn" type="button" data-overlay-close>Try again</button>
        </div>
      </div>

      <p class="kicker">
        <span class="kicker__dot" aria-hidden="true"></span>
        Final step
        <span class="kicker__tag">Secure your node</span>
      </p>
      <h1 class="access__title" id="purchase-title">Claim your <em>space.</em></h1>
      <p class="access__sub">Welcome, ${escapeHtml(name)}. Send payment to activate your private node.</p>

      <div class="purchase__price">
        <span class="purchase__price-k">Amount due</span>
        <strong class="purchase__price-v">$1,500 <small>USDT</small></strong>
        <span class="purchase__price-net">TRC20 network</span>
      </div>

      <div class="purchase__box">
        <div class="purchase__row purchase__row--stack">
          <span class="purchase__k">Wallet address</span>
          <div class="purchase__wallet">
            <code data-wallet>TQ9n8Y2kP4mX7vR3sL6wA1bC5dE8fG2hJk</code>
            <button class="purchase__copy" type="button" data-copy>Copy</button>
          </div>
        </div>
        <div class="purchase__row">
          <span class="purchase__k">Plan</span>
          <strong class="purchase__v">Private Node Access</strong>
        </div>
        <div class="purchase__row">
          <span class="purchase__k">Email</span>
          <strong class="purchase__v">${escapeHtml(email)}</strong>
        </div>
      </div>

      <button class="btn btn--primary access__submit" type="button" data-pay>
        <span>I have made payment</span>
        <span class="btn__arrow" aria-hidden="true">→</span>
      </button>

      <p class="purchase__hint">Send the exact amount to the wallet address above.</p>
    </section>
  </main>
</div>
`

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const pay = document.querySelector<HTMLButtonElement>('[data-pay]')
const overlay = document.querySelector<HTMLElement>('[data-overlay]')
const overlayCard = document.querySelector<HTMLElement>('[data-overlay-card]')
const spinner = document.querySelector<HTMLElement>('[data-spinner]')
const overlayK = document.querySelector<HTMLElement>('[data-overlay-k]')
const overlayTitle = document.querySelector<HTMLElement>('[data-overlay-title]')
const overlaySub = document.querySelector<HTMLElement>('[data-overlay-sub]')
const overlayClose = document.querySelector<HTMLButtonElement>('[data-overlay-close]')
const copy = document.querySelector<HTMLButtonElement>('[data-copy]')
const wallet = document.querySelector<HTMLElement>('[data-wallet]')

copy?.addEventListener('click', async () => {
  const text = wallet?.textContent?.trim() || ''
  try {
    await navigator.clipboard.writeText(text)
    if (copy) copy.textContent = 'Copied'
    setTimeout(() => { if (copy) copy.textContent = 'Copy' }, 1400)
  } catch {
    if (copy) copy.textContent = 'Copy failed'
    setTimeout(() => { if (copy) copy.textContent = 'Copy' }, 1400)
  }
})

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
  if (overlayCard) overlayCard.dataset.state = error ? 'error' : 'loading'
}

overlayClose?.addEventListener('click', hideOverlay)

pay?.addEventListener('click', () => {
  showOverlay()
  setOverlay('Processing payment…', 'Please ensure the payment has been made.')

  const steps = [
    ['Processing payment…', 'Please ensure the payment has been made.'],
    ['Confirming transaction…', 'Checking the network for your transfer.'],
    ['Checking network…', 'This may take a few moments.'],
    ['Still checking…', 'Please ensure the payment has been made.'],
  ] as const

  let i = 0
  const timer = window.setInterval(() => {
    i += 1
    if (i < steps.length) {
      const [msg, sub] = steps[i]
      setOverlay(msg, sub)
      return
    }
    window.clearInterval(timer)
    setOverlay('No payment received.', 'We could not confirm your transfer. Check the wallet address and amount, then try again.', true)
  }, 1400)
})
