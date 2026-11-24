import './style.css'
import { initNeuralCore } from './core'

/* ------------------------------------------------------------------
   Types & data
   ------------------------------------------------------------------ */

type Tone = 'violet' | 'cyan' | 'ember'

type Signal = {
  label: string
  value: number
  tone: Tone
}

type DecisionRecord = {
  caseId: string
  date: string
  short: string
  verdict: string
  tone: Tone
  confidence: number
  flow: string
  structure: string
  momentum: string
  context: string
  risk: string
  reason: string
  marker: string
  seed: number
  drift: number
  markerIndex: number
  signals: Signal[]
}

const records: DecisionRecord[] = [
  {
    caseId: '014',
    date: '14 Mar',
    short: 'Long',
    verdict: 'LONG',
    tone: 'violet',
    confidence: 88,
    flow: 'Institutional accumulation',
    structure: 'Higher lows into resistance',
    momentum: 'Aligned, not extended',
    context: 'Supportive',
    risk: 'Defined · invalidation set',
    reason: 'Flow and structure agree. Risk is defined before entry.',
    marker: 'SETUP',
    seed: 41,
    drift: 0.0014,
    markerIndex: 47,
    signals: [
      { label: 'Flow', value: 88, tone: 'violet' },
      { label: 'Structure', value: 82, tone: 'violet' },
      { label: 'Momentum', value: 76, tone: 'cyan' },
      { label: 'Risk', value: 84, tone: 'cyan' },
    ],
  },
  {
    caseId: '027',
    date: '02 Apr',
    short: 'Short',
    verdict: 'SHORT',
    tone: 'cyan',
    confidence: 84,
    flow: 'Distribution',
    structure: 'Lower highs, trend intact',
    momentum: 'Aligned',
    context: 'Clear',
    risk: 'Defined · invalidation set',
    reason: 'Distribution and structure agree. The path is clear and the risk is small.',
    marker: 'BREAK',
    seed: 77,
    drift: -0.0026,
    markerIndex: 50,
    signals: [
      { label: 'Flow', value: 86, tone: 'cyan' },
      { label: 'Structure', value: 80, tone: 'violet' },
      { label: 'Momentum', value: 78, tone: 'cyan' },
      { label: 'Risk', value: 74, tone: 'violet' },
    ],
  },
  {
    caseId: '041',
    date: '19 May',
    short: 'Wait',
    verdict: 'WAIT',
    tone: 'ember',
    confidence: 71,
    flow: 'Mixed',
    structure: 'Compression, no direction',
    momentum: 'Flat',
    context: 'Event risk ahead',
    risk: 'No position',
    reason: 'A range is not a setup. Patience is the position.',
    marker: 'RANGE',
    seed: 19,
    drift: 0,
    markerIndex: 40,
    signals: [
      { label: 'Flow', value: 42, tone: 'ember' },
      { label: 'Structure', value: 38, tone: 'ember' },
      { label: 'Momentum', value: 45, tone: 'ember' },
      { label: 'Risk', value: 90, tone: 'cyan' },
    ],
  },
]

/* ------------------------------------------------------------------
   Chart geometry
   ------------------------------------------------------------------ */

function seeded(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296
  }
}

function makeCloses(seed: number, drift: number, count: number, start = 0.5) {
  const random = seeded(seed)
  const closes: number[] = []
  let price = start

  for (let i = 0; i < count; i++) {
    price += drift + Math.sin(i / 4.6) * 0.012 + (random() - 0.5) * 0.045
    price = Math.max(0.12, Math.min(0.88, price))
    closes.push(price)
  }

  return closes
}

type Box = { x0: number; x1: number; y0: number; y1: number }

function candleLayer(closes: number[], box: Box, seed: number) {
  const step = (box.x1 - box.x0) / Math.max(1, closes.length - 1)
  const y = (price: number) => box.y0 + (1 - price) * (box.y1 - box.y0)
  const x = (index: number) => box.x0 + index * step
  const random = seeded(seed + 99)

  let candles = ''

  for (let i = 0; i < closes.length; i++) {
    const open = i === 0 ? closes[0]! : closes[i - 1]!
    const close = closes[i]!
    const high = Math.min(0.97, Math.max(open, close) + random() * 0.018)
    const low = Math.max(0.03, Math.min(open, close) - random() * 0.018)
    const up = close >= open
    const cx = x(i)
    const bodyWidth = Math.max(2.2, step * 0.5)
    const top = y(Math.max(open, close))
    const bottom = y(Math.min(open, close))

    candles += `<line x1="${cx.toFixed(1)}" y1="${y(high).toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y(low).toFixed(1)}" class="candle-wick ${up ? 'is-up' : 'is-down'}"/>`
    candles += `<rect x="${(cx - bodyWidth / 2).toFixed(1)}" y="${top.toFixed(1)}" width="${bodyWidth.toFixed(1)}" height="${Math.max(1.3, bottom - top).toFixed(1)}" class="candle-body ${up ? 'is-up' : 'is-down'}"/>`
  }

  const line = closes
    .map((close, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(close).toFixed(1)}`)
    .join(' ')

  return { candles, line, x, y }
}

function decisionChartMarkup(record: DecisionRecord) {
  const closes = makeCloses(record.seed, record.drift, 64, 0.5)
  const layer = candleLayer(closes, { x0: 24, x1: 720, y0: 30, y1: 320 }, record.seed)
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const resistanceY = layer.y(max)
  const supportY = layer.y(min)
  const markerIndex = Math.min(record.markerIndex, closes.length - 1)
  const markerX = layer.x(markerIndex)
  const markerY = layer.y(closes[markerIndex]!)
  const last = closes[closes.length - 1]!
  const lastX = layer.x(closes.length - 1)
  const lastY = layer.y(last)

  const grid = [0, 1, 2, 3, 4]
    .map((index) => {
      const y = 70 + index * 62
      return `<line x1="0" y1="${y}" x2="720" y2="${y}"></line>`
    })
    .join('')

  return `<svg viewBox="0 0 760 360" role="img" aria-label="Illustrative market structure chart for case ${record.caseId}">
    <g class="chart-grid">${grid}</g>
    <line class="chart-level" x1="0" y1="${resistanceY.toFixed(1)}" x2="720" y2="${resistanceY.toFixed(1)}"></line>
    <line class="chart-level chart-level--support" x1="0" y1="${supportY.toFixed(1)}" x2="720" y2="${supportY.toFixed(1)}"></line>
    <text class="chart-label chart-label--resistance" x="0" y="${(resistanceY - 6).toFixed(1)}">RESISTANCE</text>
    <text class="chart-label chart-label--support" x="0" y="${(supportY + 12).toFixed(1)}">SUPPORT</text>
    <g class="chart-candles">${layer.candles}</g>
    <path class="chart-line" pathLength="1" d="${layer.line}"></path>
    <line class="chart-crosshair" x1="${markerX.toFixed(1)}" y1="20" x2="${markerX.toFixed(1)}" y2="332"></line>
    <circle class="chart-marker-pulse" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="4"></circle>
    <circle class="chart-marker" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="4"></circle>
    <circle class="chart-end" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3"></circle>
    <text class="chart-label chart-label--support" x="${(markerX - 8).toFixed(1)}" y="${(markerY - 12).toFixed(1)}" text-anchor="end">${record.marker}</text>
  </svg>`
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

app.innerHTML = `
<a class="skip-link" href="#intelligence">Skip to content</a>
<div class="scroll-progress" aria-hidden="true"><span data-progress></span></div>

<header class="topbar" data-header>
  <div class="wrap topbar__inner">
    <a class="brand" href="#top" aria-label="ỌGBỌN — back to top">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
      <span class="brand__slash" aria-hidden="true">/</span>
      <span class="brand__desc">Market Intelligence</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="#intelligence">Intelligence</a>
      <a href="#decisions">Decisions</a>
      <a href="#human">Human</a>
    </nav>
    <div class="topbar__end">
      <span class="status"><i class="status__dot" aria-hidden="true"></i>System online</span>
      <span class="topbar__clock"><b data-clock>--:--</b> UTC</span>
      <a class="topbar__access" href="/access.html">Enter system</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu" data-menu-btn>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span class="sr-only">Open menu</span>
      </button>
    </div>
  </div>
</header>

<div class="menu" id="menu" aria-hidden="true" data-menu>
  <nav class="menu__nav" aria-label="Mobile">
    <a href="#intelligence"><span>01</span> Intelligence</a>
    <a href="#decisions"><span>02</span> Decisions</a>
    <a href="#human"><span>03</span> Human</a>
    <a href="/access.html"><span>04</span> Enter system</a>
  </nav>
  <div class="menu__foot">
    <span>Private node</span>
    <span data-clock>--:--</span>
  </div>
</div>

<main id="top">
  <section class="hero">
    <div class="hero__art" aria-hidden="true"></div>
    <div class="hero__veil" aria-hidden="true"></div>

    <div class="wrap hero__inner">
      <div class="hero__copy">
        <p class="kicker">
          <span class="kicker__dot" aria-hidden="true"></span>
          Institutional market intelligence
          <span class="kicker__tag">Private node</span>
        </p>
        <h1 class="hero__title">
          The AI <em>reasons.</em><br />You decide.
        </h1>
        <p class="hero__sub">
          Live institutional flow, weighed in real time. Each call comes with
          evidence, risk, and a reason.
        </p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="/access.html">
            <span>Enter system</span>
            <span class="btn__arrow" aria-hidden="true">→</span>
          </a>
          <a class="btn btn--ghost" href="#intelligence">
            <span>See how it thinks</span>
            <span class="btn__arrow" aria-hidden="true">↓</span>
          </a>
        </div>
      </div>

      <div class="hero__core">
        <div class="core">
          <canvas class="core__canvas" data-neural aria-hidden="true"></canvas>
          <span class="core__label core__label--tl"><b>Input</b>Institutional flow</span>
          <span class="core__label core__label--tr"><b>Context</b>Real-time</span>
          <span class="core__label core__label--bl"><b>Risk</b>Defined</span>
          <span class="core__label core__label--br"><b>Reasoning</b>Explained</span>
          <div class="core__center">
            <span class="core__center-k">Verdict</span>
            <strong class="core__center-v">LONG</strong>
            <span class="core__center-s">Awaiting your review</span>
          </div>
        </div>
        <div class="core__readout">
          <span>Model Ọ-1</span>
          <span>Signals 14/14</span>
          <span>Latency 42ms</span>
        </div>
      </div>
    </div>
  </section>

  <section class="section intelligence" id="intelligence">
    <div class="wrap">
      <div class="section__head section__head--split" data-reveal>
        <div>
          <p class="eyebrow"><span>01</span> The edge</p>
          <h2 class="section__title">The system gets you to <em>90.</em> You take it to <em>100.</em></h2>
        </div>
        <p class="section__lead">
          Flow, structure, momentum, risk. Read live, explained plain.
        </p>
      </div>

      <div class="ratio" data-reveal>
        <div class="ratio__cell">
          <span class="ratio__v">90<small>%</small></span>
          <span class="ratio__k">The system</span>
          <p>Reads the market. Hits at least 90%.</p>
        </div>
        <span class="ratio__op" aria-hidden="true">+</span>
        <div class="ratio__cell">
          <span class="ratio__v">10<small>%</small></span>
          <span class="ratio__k">You</span>
          <p>Your read. The part no model has.</p>
        </div>
        <span class="ratio__op" aria-hidden="true">=</span>
        <div class="ratio__cell ratio__cell--total">
          <span class="ratio__v">100<small>%</small></span>
          <span class="ratio__k">The call</span>
          <p>Clear enough to act on.</p>
        </div>
      </div>

      <div class="manifesto" data-reveal>
        <p>Not a signal feed. Not a bot. <em>A reasoning engine.</em></p>
        <p>No copied calls. No blind execution.</p>
      </div>
    </div>
  </section>

  <section class="section decisions" id="decisions">
    <div class="wrap">
      <div class="section__head section__head--split" data-reveal>
        <div>
          <p class="eyebrow"><span>02</span> Decision records</p>
          <h2 class="section__title">The case, <em>not the call.</em></h2>
        </div>
        <p class="section__lead">Three records. Evidence, risk, reasoning.</p>
      </div>

      <div class="case-tabs" role="tablist" aria-label="Decision records" data-tabs></div>

      <article class="case" id="case" role="tabpanel" aria-live="polite" data-panel>
        <div class="case__chart">
          <div class="case__chart-head">
            <span>Market · Structure</span>
            <span data-field="caseId"></span>
          </div>
          <div class="case__chart-body" data-chart></div>
          <div class="case__chart-foot">
            <span>Real-time flow</span>
            <span>Reasoning trace</span>
          </div>
        </div>

        <div class="case__readout">
          <div class="case__verdict">
            <span class="case__verdict-k">Verdict</span>
            <strong class="case__verdict-v" data-field="verdict"></strong>
            <span class="case__verdict-c" data-field="confidence"></span>
          </div>

          <div class="case__signals" data-signals></div>

          <dl class="case__rows">
            <div class="case__row"><dt>Flow</dt><dd data-field="flow"></dd></div>
            <div class="case__row"><dt>Structure</dt><dd data-field="structure"></dd></div>
            <div class="case__row"><dt>Momentum</dt><dd data-field="momentum"></dd></div>
            <div class="case__row"><dt>Context</dt><dd data-field="context"></dd></div>
            <div class="case__row"><dt>Risk</dt><dd data-field="risk"></dd></div>
          </dl>

          <p class="case__reason" data-field="reason"></p>
        </div>
      </article>
    </div>
  </section>

  <section class="section human" id="human">
    <div class="wrap">
      <div class="section__head section__head--split" data-reveal>
        <div>
          <p class="eyebrow"><span>03</span> Execution</p>
          <h2 class="section__title">Nothing fires <em>on its own.</em></h2>
        </div>
        <p class="section__lead">
          The model reads the market and lays out the case. You decide if it is worth taking.
        </p>
      </div>

      <div class="handoff" data-reveal>
        <div class="handoff__grid">
          <article class="handoff__side">
            <span class="handoff__tag">The model</span>
            <h3>Does the reading.</h3>
            <ul>
              <li>Live institutional flow</li>
              <li>Structure and momentum</li>
              <li>Risk and invalidation</li>
              <li>A verdict, with reasons</li>
            </ul>
          </article>
          <article class="handoff__side handoff__side--you">
            <span class="handoff__tag">You</span>
            <h3>Make the call.</h3>
            <ul>
              <li>The final read</li>
              <li>Size and timing</li>
              <li>The order</li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div>
        <p class="footer__line">Wisdom, before the trade.</p>
        <p class="footer__sub">Private by design.</p>
      </div>
      <div class="footer__meta">
        <span>Private node</span>
        <span data-clock>--:--</span>
        <span>Model Ọ-1</span>
      </div>
    </div>
    <div class="footer__word" aria-hidden="true">ỌGBỌN</div>
    <div class="footer__fine">
      <span>© <span data-year>2026</span> ỌGBỌN</span>
        <span>Mark · Vite bolt</span>
    </div>
  </div>
</footer>
`

/* ------------------------------------------------------------------
   Canvas layers
   ------------------------------------------------------------------ */

const neural = document.querySelector<HTMLCanvasElement>('[data-neural]')
if (neural) initNeuralCore(neural)

/* ------------------------------------------------------------------
   Decision records
   ------------------------------------------------------------------ */

const tabsEl = document.querySelector<HTMLElement>('[data-tabs]')
const panel = document.querySelector<HTMLElement>('[data-panel]')

if (tabsEl && panel) {
  const panelEl = panel
  const fields = new Map<string, HTMLElement>()
  panelEl.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => {
    if (el.dataset.field) fields.set(el.dataset.field, el)
  })

  tabsEl.innerHTML = records
    .map(
      (record, index) => `
      <button
        class="case-tab"
        type="button"
        role="tab"
        id="case-tab-${index}"
        aria-controls="case"
        aria-selected="${index === 0}"
        tabindex="${index === 0 ? 0 : -1}"
        data-record="${index}"
      >
        <span class="case-tab__id">Case ${record.caseId}</span>
        <span class="case-tab__date">${record.date}</span>
        <span class="case-tab__verdict"><i class="dot dot--${record.tone}" aria-hidden="true"></i>${record.short}</span>
      </button>`,
    )
    .join('')

  const tabs = Array.from(tabsEl.querySelectorAll<HTMLButtonElement>('[data-record]'))
  let activeIndex = 0
  let swapTimer = 0

  function renderSignals(record: DecisionRecord) {
    const container = panelEl.querySelector<HTMLElement>('[data-signals]')
    if (!container) return

    container.innerHTML = record.signals
      .map(
        (signal) => `
        <div class="signal signal--${signal.tone}">
          <span class="signal__label">${signal.label}</span>
          <span class="signal__bar"><i style="width: ${signal.value}%"></i></span>
          <span class="signal__value">${signal.value}</span>
        </div>`,
      )
      .join('')
  }

  function renderRecord(index: number) {
    const record = records[index]
    if (!record) return

    fields.get('flow')!.textContent = record.flow
    fields.get('structure')!.textContent = record.structure
    fields.get('momentum')!.textContent = record.momentum
    fields.get('context')!.textContent = record.context
    fields.get('risk')!.textContent = record.risk
    fields.get('reason')!.textContent = record.reason
    fields.get('caseId')!.textContent = `Case ${record.caseId}`
    fields.get('confidence')!.textContent = `${record.confidence}% conviction`

    const verdict = fields.get('verdict')!
    verdict.textContent = record.verdict
    verdict.classList.toggle('is-violet', record.tone === 'violet')
    verdict.classList.toggle('is-cyan', record.tone === 'cyan')

    const chart = panelEl.querySelector<HTMLElement>('[data-chart]')
    if (chart) chart.innerHTML = decisionChartMarkup(record)

    renderSignals(record)
  }

  function selectRecord(index: number, immediate = false) {
    if (index === activeIndex && !immediate) return
    activeIndex = index

    tabs.forEach((tab, tabIndex) => {
      const selected = tabIndex === index
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
    })

    if (immediate) {
      renderRecord(index)
      return
    }

    panelEl.classList.add('is-swapping')
    window.clearTimeout(swapTimer)
    swapTimer = window.setTimeout(() => {
      renderRecord(index)
      window.requestAnimationFrame(() => panelEl.classList.remove('is-swapping'))
    }, 160)
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectRecord(index))
  })

  tabsEl.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const next = (activeIndex + direction + tabs.length) % tabs.length
    tabs[next]?.focus()
    selectRecord(next)
  })

  selectRecord(0, true)
}

/* ------------------------------------------------------------------
   Reveal on scroll
   ------------------------------------------------------------------ */

const revealEls = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  )

  revealEls.forEach((el) => observer.observe(el))
} else {
  revealEls.forEach((el) => el.classList.add('is-in'))
}

/* ------------------------------------------------------------------
   Header & scroll progress
   ------------------------------------------------------------------ */

const header = document.querySelector<HTMLElement>('[data-header]')
const progress = document.querySelector<HTMLElement>('[data-progress]')

function onScroll() {
  const y = window.scrollY
  header?.classList.toggle('is-scrolled', y > 24)

  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`
  }
}

window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

/* ------------------------------------------------------------------
   Menu
   ------------------------------------------------------------------ */

const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-btn]')
const menu = document.querySelector<HTMLElement>('[data-menu]')

if (menuBtn && menu) {
  const setMenu = (open: boolean) => {
    menuBtn.setAttribute('aria-expanded', String(open))
    menuBtn.querySelector('.sr-only')!.textContent = open ? 'Close menu' : 'Open menu'
    menu.setAttribute('aria-hidden', String(!open))
    document.body.classList.toggle('menu-open', open)

    if (open) {
      menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true })
    } else {
      menuBtn.focus({ preventScroll: true })
    }
  }

  menuBtn.addEventListener('click', () => {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true')
  })

  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false))
  })

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') {
      setMenu(false)
    }
  })
}

/* ------------------------------------------------------------------
   Clock & year
   ------------------------------------------------------------------ */

const clocks = Array.from(document.querySelectorAll<HTMLElement>('[data-clock]'))
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
})

function updateTime() {
  const time = timeFormatter.format(new Date())
  clocks.forEach((clock) => {
    clock.textContent = time
  })
}

updateTime()
window.setInterval(updateTime, 20000)

document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear())
})
