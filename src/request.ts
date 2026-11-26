import './style.css'
import { initLang, langMarkup } from './lang'
import { setFlow, getFlow } from './flow'
import { INVITE_CODE } from './config'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

const params = new URLSearchParams(location.search)
if (params.get('reset') === '1') localStorage.removeItem('ogbon_flow')
const saved = getFlow()
if (saved?.step === 'purchase') window.location.replace('/purchase.html')
const inviteCode = INVITE_CODE

app.innerHTML = `
<div class="access">
  <div class="access__bg" aria-hidden="true"></div>
  <header class="access__top">
    <a class="brand" href="/" aria-label="ỌGBỌN — home">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
      <span class="brand__slash" aria-hidden="true">/</span>
      <span class="brand__desc">Request access</span>
    </a>
    <div class="access__top-end">
      ${langMarkup}
      <a class="access__back" href="/access.html?reset=1">Back to sign in</a>
    </div>
  </header>

  <main class="access__main">
    <section class="access__card" aria-labelledby="request-title">
      <p class="kicker">
        <span class="kicker__dot" aria-hidden="true"></span>
        Private node
        <span class="kicker__tag">Application</span>
      </p>
      <h1 class="access__title" id="request-title">Request your <em>seat.</em></h1>
      <p class="access__sub">A few details to place you in the queue.</p>

      <form class="access__form" data-form novalidate>
        <label class="field">
          <span class="field__label">Full name</span>
          <input class="field__input" name="name" autocomplete="name" placeholder="Your name" value="${escapeAttr(saved?.name || '')}" />
        </label>
        <label class="field">
          <span class="field__label">Email</span>
          <input class="field__input" type="email" name="email" autocomplete="email" placeholder="you@firm.com" value="${escapeAttr(saved?.email || '')}" />
        </label>
        <label class="field">
          <span class="field__label">What do you trade?</span>
          <input class="field__input" name="market" placeholder="FX, crypto, indices..." value="${escapeAttr(saved?.market || '')}" />
        </label>
        <label class="field">
          <span class="field__label">Experience</span>
          <select class="field__input" name="experience">
            <option value="">Select one</option>
            ${['Under 1 year','1–3 years','3–5 years','5+ years'].map(o => `<option ${saved?.experience===o?'selected':''}>${o}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span class="field__label">Invite code</span>
          <input class="field__input" name="invite" autocomplete="off" placeholder="Enter invite code" />
        </label>

        <button class="btn btn--primary access__submit" type="submit">
          <span>Continue</span>
          <span class="btn__arrow" aria-hidden="true">→</span>
        </button>
        <p class="access__status" role="status" aria-live="polite" data-status>All fields are required.</p>
      </form>
    </section>

    <aside class="access__aside" aria-hidden="true">
      <div class="access__mock">
        <div class="access__mock-top">
          <span>Application</span>
          <span class="access__mock-live"><i></i>Private</span>
        </div>
        <div class="access__mock-metric"><span class="access__mock-k">Access</span><strong>Invite only</strong></div>
        <div class="access__mock-metric"><span class="access__mock-k">Invite code</span><strong>${inviteCode}</strong></div>
        <div class="access__mock-metric"><span class="access__mock-k">Review</span><strong>Manual</strong></div>
        <div class="access__mock-metric"><span class="access__mock-k">Control</span><strong>Yours</strong></div>
      </div>
    </aside>
  </main>
</div>
`

function escapeAttr(value: string) {
  return value.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

const form = document.querySelector<HTMLFormElement>('[data-form]')
const status = document.querySelector<HTMLElement>('[data-status]')

setFlow({ step: 'request' })

form?.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = new FormData(form)
  const name = String(data.get('name') || '').trim()
  const email = String(data.get('email') || '').trim()
  const market = String(data.get('market') || '').trim()
  const experience = String(data.get('experience') || '').trim()
  const invite = String(data.get('invite') || '').trim().toUpperCase()

  if (!name || !email || !market || !experience || !invite) {
    if (status) { status.textContent = 'Please complete all fields.'; status.dataset.tone = 'alert' }
    return
  }

  if (invite !== inviteCode) {
    if (status) { status.textContent = 'Unauthorized invite code.'; status.dataset.tone = 'alert' }
    return
  }

  if (status) { status.textContent = 'Saving your request…'; status.dataset.tone = 'muted' }

  try {
    const res = await fetch('/api/request-access', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, market, experience, invite }),
    })

    if (res.status === 401) {
      if (status) { status.textContent = 'Unauthorized invite code.'; status.dataset.tone = 'alert' }
      return
    }
  } catch {}

  setFlow({ step: 'purchase', name, email, market, experience })
  sessionStorage.setItem('ogbon_request_email', email)
  sessionStorage.setItem('ogbon_request_name', name)
  window.location.href = '/purchase.html'
})

initLang()
