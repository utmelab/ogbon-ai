import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

app.innerHTML = `
<div class="access">
  <div class="access__bg" aria-hidden="true"></div>
  <header class="access__top">
    <a class="brand" href="/" aria-label="ỌGBỌN — home">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
      <span class="brand__slash" aria-hidden="true">/</span>
      <span class="brand__desc">Private access</span>
    </a>
    <a class="access__back" href="/">Back to site</a>
  </header>

  <main class="access__main">
    <section class="access__card" aria-labelledby="access-title">
      <p class="kicker">
        <span class="kicker__dot" aria-hidden="true"></span>
        Secure node
        <span class="kicker__tag">Invite only</span>
      </p>
      <h1 class="access__title" id="access-title">Sign in to <em>ỌGBỌN.</em></h1>
      <p class="access__sub" data-sub>Private market intelligence. Authorized operators only.</p>

      <form class="access__form" data-form novalidate>
        <label class="field" data-email-field>
          <span class="field__label">Email</span>
          <input class="field__input" type="email" name="email" autocomplete="email" placeholder="you@firm.com" />
        </label>

        <div class="field" data-key-field>
          <label class="field__label" for="access-key">Access key</label>
          <input class="field__input" id="access-key" type="password" name="key" autocomplete="current-password" placeholder="••••••••••••" />
        </div>

        <div class="access__actions">
          <button class="field__link" type="button" data-forgot>Forgot key?</button>
        </div>

        <button class="btn btn--primary access__submit" type="submit" data-submit>
          <span data-submit-label>Enter system</span>
          <span class="btn__arrow" aria-hidden="true">→</span>
        </button>

        <p class="access__status" role="status" aria-live="polite" data-status>
          Use your assigned credentials.
        </p>
      </form>

      <div class="access__divider" aria-hidden="true"><span>or</span></div>

      <button class="access__alt" type="button" data-request>
        <span>Request access</span>
        <span aria-hidden="true">↗</span>
      </button>

      <p class="access__fine">
        By continuing, you confirm you are an authorized operator.
      </p>
    </section>

    <aside class="access__aside" aria-hidden="true">
      <div class="access__mock">
        <div class="access__mock-top">
          <span>System status</span>
          <span class="access__mock-live"><i></i>Live</span>
        </div>
        <div class="access__mock-metric">
          <span class="access__mock-k">Model</span>
          <strong>Ọ-1</strong>
        </div>
        <div class="access__mock-metric">
          <span class="access__mock-k">Coverage</span>
          <strong>Global markets</strong>
        </div>
        <div class="access__mock-metric">
          <span class="access__mock-k">Latency</span>
          <strong>42ms</strong>
        </div>
        <div class="access__mock-metric">
          <span class="access__mock-k">Execution</span>
          <strong>Manual only</strong>
        </div>
        <div class="access__mock-trace">
          <span>Signal trace</span>
          <div class="access__mock-bar"><i></i></div>
          <span>14/14</span>
        </div>
      </div>
    </aside>
  </main>
</div>
`

const form = document.querySelector<HTMLFormElement>('[data-form]')
const status = document.querySelector<HTMLElement>('[data-status]')
const forgot = document.querySelector<HTMLButtonElement>('[data-forgot]')
const request = document.querySelector<HTMLButtonElement>('[data-request]')
const keyField = document.querySelector<HTMLElement>('[data-key-field]')
const submitLabel = document.querySelector<HTMLElement>('[data-submit-label]')
const sub = document.querySelector<HTMLElement>('[data-sub]')
const title = document.querySelector<HTMLElement>('#access-title')

let mode: 'signin' | 'forgot' = 'signin'

function setStatus(message: string, tone: 'muted' | 'ok' | 'alert' = 'muted') {
  if (!status) return
  status.textContent = message
  status.dataset.tone = tone
}

function setMode(next: 'signin' | 'forgot') {
  mode = next
  const keyInput = form?.querySelector<HTMLInputElement>('input[name="key"]')
  if (mode === 'forgot') {
    if (keyField) keyField.style.display = 'none'
    if (submitLabel) submitLabel.textContent = 'Send recovery email'
    if (sub) sub.textContent = 'Enter the email linked to your access key.'
    if (title) title.innerHTML = 'Recover your <em>access.</em>'
    if (forgot) forgot.textContent = 'Back to sign in'
    if (keyInput) keyInput.value = ''
    setStatus('Enter your email to continue.', 'muted')
  } else {
    if (keyField) keyField.style.display = ''
    if (submitLabel) submitLabel.textContent = 'Enter system'
    if (sub) sub.textContent = 'Private market intelligence. Authorized operators only.'
    if (title) title.innerHTML = 'Sign in to <em>ỌGBỌN.</em>'
    if (forgot) forgot.textContent = 'Forgot key?'
    setStatus('Use your assigned credentials.', 'muted')
  }
}

form?.addEventListener('submit', (event) => {
  event.preventDefault()
  const data = new FormData(form)
  const email = String(data.get('email') || '').trim()
  const key = String(data.get('key') || '').trim()

  if (!email) {
    setStatus('Enter your email address.', 'alert')
    return
  }

  if (mode === 'signin' && !key) {
    setStatus('Enter your access key.', 'alert')
    return
  }

  setStatus('Checking…', 'muted')
  window.setTimeout(() => {
    setStatus('This email is not registered in the system.', 'alert')
  }, 700)
})

forgot?.addEventListener('click', () => {
  setMode(mode === 'forgot' ? 'signin' : 'forgot')
})

request?.addEventListener('click', () => {
  window.location.href = '/request.html'
})
