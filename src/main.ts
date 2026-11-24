import './style.css'
import { initMarketField } from './background'
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
  tone: 'violet' | 'ember'
  confidence: number
  bias: string
  structure: string
  momentum: string
  context: string
  risk: string
  reason: string
  support: string
  resistance: string
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
    short: 'Wait',
    verdict: 'WAIT',
    tone: 'ember',
    confidence: 62,
    bias: 'Bullish, late',
    structure: 'Third test of 1.2618',
    momentum: 'Weakening into 1.2740',
    context: 'US CPI · 6h',
    risk: '0.50% · stop 1.2571',
    reason: 'The setup is real. The timing is not.',
    support: '1.2618',
    resistance: '1.2740',
    marker: 'THIRD TEST',
    seed: 41,
    drift: 0.0014,
    markerIndex: 47,
    signals: [
      { label: 'Structure', value: 74, tone: 'violet' },
      { label: 'Momentum', value: 38, tone: 'ember' },
      { label: 'Context', value: 30, tone: 'ember' },
      { label: 'Risk', value: 80, tone: 'cyan' },
    ],
  },
  {
    caseId: '027',
    date: '02 Apr',
    short: 'Short',
    verdict: 'SHORT',
    tone: 'violet',
    confidence: 81,
    bias: 'Bearish',
    structure: 'Lower highs since 1.2890',
    momentum: 'Aligned, not extended',
    context: 'Clear',
    risk: '0.50% · stop 1.2812',
    reason: 'Structure, momentum and context agree. Risk is defined first.',
    support: '1.2812',
    resistance: '1.2890',
    marker: 'BREAK',
    seed: 77,
    drift: -0.0026,
    markerIndex: 50,
    signals: [
      { label: 'Structure', value: 86, tone: 'violet' },
      { label: 'Momentum', value: 78, tone: 'cyan' },
      { label: 'Context', value: 71, tone: 'cyan' },
      { label: 'Risk', value: 66, tone: 'violet' },
    ],
  },
  {
    caseId: '041',
    date: '19 May',
    short: 'Wait',
    verdict: 'WAIT',
    tone: 'ember',
    confidence: 48,
    bias: 'Range',
    structure: '1.2500–1.2680 · 11 sessions',
    momentum: 'Flat',
    context: 'BoE · 2 days',
    risk: 'No position',
    reason: 'A range is not a setup. Patience is the position.',
    support: '1.2500',
    resistance: '1.2680',
    marker: 'RANGE',
    seed: 19,
    drift: 0,
    markerIndex: 40,
    signals: [
      { label: 'Structure', value: 40, tone: 'ember' },
      { label: 'Momentum', value: 45, tone: 'ember' },
      { label: 'Context', value: 35, tone: 'ember' },
      { label: 'Risk', value: 90, tone: 'cyan' },
    ],
  },
]

const pipeline = [
  { n: '01', name: 'Ingest', desc: 'OHLC · ticks · spreads' },
  { n: '02', name: 'Feature', desc: 'Structure · levels · volatility' },
  { n: '03', name: 'Context', desc: 'Sessions · macro · calendar' },
  { n: '04', name: 'Risk', desc: 'Exposure · stop distance' },
  { n: '05', name: 'Decide', desc: 'Long · short · wait' },
  { n: '06', name: 'Explain', desc: 'The reason, in language' },
]

const guardrails = [
  ['One instrument', 'GBP/USD only.'],
  ['One timeframe', 'Daily close.'],
  ['Risk before reward', '0.50% per idea.'],
  ['No trade is a position', 'Standing aside is a decision.'],
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
  const layer = candleLayer(closes, { x0: 24, x1: 700, y0: 30, y1: 320 }, record.seed)
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
      return `<line x1="0" y1="${y}" x2="700" y2="${y}"></line>`
    })
    .join('')

  const axis = ['1.2900', '1.2800', '1.2700', '1.2600', '1.2500']
    .map((label, index) => `<text class="chart-label" x="714" y="${74 + index * 62}">${label}</text>`)
    .join('')

  return `<svg viewBox="0 0 760 360" role="img" aria-label="Illustrative GBP/USD daily chart for case ${record.caseId}">
    <g class="chart-grid">${grid}</g>
    ${axis}
    <line class="chart-level" x1="0" y1="${resistanceY.toFixed(1)}" x2="700" y2="${resistanceY.toFixed(1)}"></line>
    <line class="chart-level chart-level--support" x1="0" y1="${supportY.toFixed(1)}" x2="700" y2="${supportY.toFixed(1)}"></line>
    <text class="chart-label chart-label--resistance" x="0" y="${(resistanceY - 6).toFixed(1)}">RESISTANCE ${record.resistance}</text>
    <text class="chart-label chart-label--support" x="0" y="${(supportY + 12).toFixed(1)}">SUPPORT ${record.support}</text>
    <g class="chart-candles">${layer.candles}</g>
    <path class="chart-line" pathLength="1" d="${layer.line}"></path>
    <line class="chart-crosshair" x1="${markerX.toFixed(1)}" y1="20" x2="${markerX.toFixed(1)}" y2="332"></line>
    <circle class="chart-marker-pulse" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="4"></circle>
    <circle class="chart-marker" cx="${markerX.toFixed(1)}" cy="${markerY.toFixed(1)}" r="4"></circle>
    <circle class="chart-end" cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="3"></circle>
    <text class="chart-label chart-label--support" x="${(markerX - 8).toFixed(1)}" y="${(markerY - 12).toFixed(1)}" text-anchor="end">${record.marker}</text>
  </svg>`
}

function instrumentStripMarkup() {
  const closes = makeCloses(29, 0.0016, 96, 0.46)
  const layer = candleLayer(closes, { x0: 0, x1: 1200, y0: 20, y1: 180 }, 29)

  return `<svg viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">
    <g class="chart-candles">${layer.candles}</g>
    <path class="chart-line chart-line--soft" pathLength="1" d="${layer.line}"></path>
  </svg>`
}

/* ------------------------------------------------------------------
   Page
   ------------------------------------------------------------------ */

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('Missing #app')

app.innerHTML = `
<a class="skip-link" href="#pipeline">Skip to content</a>
<div class="scroll-progress" aria-hidden="true"><span data-progress></span></div>

<header class="topbar" data-header>
  <div class="wrap topbar__inner">
    <a class="brand" href="#top" aria-label="ỌGBỌN — back to top">
      <svg class="brand__bolt" aria-hidden="true"><use href="#bolt"></use></svg>
      <span class="brand__word">ỌGBỌN</span>
      <span class="brand__slash" aria-hidden="true">/</span>
      <span class="brand__desc">Forex Intelligence</span>
    </a>
    <nav class="nav" aria-label="Primary">
      <a href="#pipeline">Pipeline</a>
      <a href="#decisions">Decisions</a>
      <a href="#instrument">Instrument</a>
      <a href="#guardrails">Guardrails</a>
    </nav>
    <div class="topbar__end">
      <span class="status"><i class="status__dot" aria-hidden="true"></i>System online</span>
      <span class="topbar__clock"><b data-clock>--:--</b> WAT</span>
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
    <a href="#pipeline"><span>01</span> Pipeline</a>
    <a href="#decisions"><span>02</span> Decisions</a>
    <a href="#instrument"><span>03</span> Instrument</a>
    <a href="#guardrails"><span>04</span> Guardrails</a>
  </nav>
  <div class="menu__foot">
    <span>Private node · Lagos, NG</span>
    <span data-clock>--:--</span>
  </div>
</div>

<main id="top">
  <section class="hero">
    <canvas class="hero__field" data-field aria-hidden="true"></canvas>
    <div class="hero__veil" aria-hidden="true"></div>

    <div class="wrap hero__inner">
      <div class="hero__copy">
        <p class="kicker">
          <span class="kicker__dot" aria-hidden="true"></span>
          Autonomous Forex Intelligence
          <span class="kicker__tag">Private node</span>
        </p>
        <h1 class="hero__title">
          The <em>thinking</em><br />behind the trade.
        </h1>
        <p class="hero__sub">
          A private AI for GBP/USD. It reads structure, momentum and risk —
          then decides. Or stands aside.
        </p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#pipeline">
            <span>Enter the pipeline</span>
            <span class="btn__arrow" aria-hidden="true">↓</span>
          </a>
          <a class="btn btn--ghost" href="#decisions">
            <span>Open a decision</span>
            <span class="btn__arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <ul class="hero__facts">
          <li><b>AI</b><span>Reasoning engine</span></li>
          <li><b>01</b><span>Instrument</span></li>
          <li><b>D1</b><span>Timeframe</span></li>
          <li><b>1</b><span>Verdict</span></li>
        </ul>
      </div>

      <div class="hero__core">
        <div class="core">
          <canvas class="core__canvas" data-neural aria-hidden="true"></canvas>
          <span class="core__label core__label--tl"><b>Input</b>Price feed<em data-price>1.2638</em></span>
          <span class="core__label core__label--tr"><b>Structure</b>HH · HL</span>
          <span class="core__label core__label--bl"><b>Momentum</b>Weakening</span>
          <span class="core__label core__label--br"><b>Risk</b>0.50%</span>
          <div class="core__center">
            <span class="core__center-k">Verdict</span>
            <strong class="core__center-v">WAIT</strong>
            <span class="core__center-s">62% conviction</span>
          </div>
        </div>
        <div class="core__readout">
          <span>Model Ọ-1</span>
          <span>Signals 14/14</span>
          <span>Latency 42ms</span>
        </div>
      </div>
    </div>

    <div class="hero__tape">
      <div class="wrap hero__tape-inner">
        <div class="tape-cell"><span>Pair</span><b>GBP/USD</b></div>
        <div class="tape-cell"><span>Price</span><b data-price>1.2638</b></div>
        <div class="tape-cell"><span>Bias</span><b>Bullish</b></div>
        <div class="tape-cell"><span>Structure</span><b>HH · HL</b></div>
        <div class="tape-cell"><span>Momentum</span><b>Weak</b></div>
        <div class="tape-cell tape-cell--verdict"><span>Verdict</span><b>WAIT</b></div>
      </div>
    </div>
  </section>

  <section class="section pipeline" id="pipeline">
    <div class="wrap">
      <div class="section__head" data-reveal>
        <p class="eyebrow"><span>01</span> The pipeline</p>
        <h2 class="section__title">Signal in. <em>Verdict out.</em></h2>
        <p class="section__lead">Six stages. Every input accounted for.</p>
      </div>

      <ol class="pipeline__grid">
        ${pipeline
          .map(
            (stage, index) => `
          <li class="stage" data-reveal style="--d: ${index * 60}ms">
            <span class="stage__n">${stage.n}</span>
            <span class="stage__icon" aria-hidden="true"><i></i></span>
            <h3 class="stage__name">${stage.name}</h3>
            <p class="stage__desc">${stage.desc}</p>
            <span class="stage__state">OK</span>
          </li>`,
          )
          .join('')}
      </ol>

      <div class="pipeline__trace" data-reveal aria-hidden="true">
        <span>TRACE</span>
        <div class="pipeline__track"><i></i></div>
        <span>14/14 signals resolved</span>
      </div>
    </div>
  </section>

  <section class="section decisions" id="decisions">
    <div class="wrap">
      <div class="section__head section__head--split" data-reveal>
        <div>
          <p class="eyebrow"><span>02</span> Decision engine</p>
          <h2 class="section__title">The case, <em>not the call.</em></h2>
        </div>
        <p class="section__lead">Three records. The chart, the evidence, the verdict.</p>
      </div>

      <div class="case-tabs" role="tablist" aria-label="Decision records" data-tabs></div>

      <article class="case" id="case" role="tabpanel" aria-live="polite" data-panel>
        <div class="case__chart">
          <div class="case__chart-head">
            <span>GBP/USD · D1</span>
            <span data-field="caseId"></span>
          </div>
          <div class="case__chart-body" data-chart></div>
          <div class="case__chart-foot">
            <span>64 sessions · daily</span>
            <span>Levels marked</span>
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
            <div class="case__row"><dt>Bias</dt><dd data-field="bias"></dd></div>
            <div class="case__row"><dt>Structure</dt><dd data-field="structure"></dd></div>
            <div class="case__row"><dt>Momentum</dt><dd data-field="momentum"></dd></div>
            <div class="case__row"><dt>Context</dt><dd data-field="context"></dd></div>
            <div class="case__row"><dt>Risk</dt><dd data-field="risk"></dd></div>
          </dl>

          <p class="case__reason" data-field="reason"></p>
        </div>

        <div class="case__foot">
          <span>Reasoned · not predicted</span>
          <span>Sealed · 06:00 WAT</span>
        </div>
      </article>
    </div>
  </section>

  <section class="section instrument" id="instrument">
    <div class="wrap">
      <div class="instrument__head" data-reveal>
        <p class="eyebrow"><span>03</span> The instrument</p>
        <span class="instrument__tag">GBP/USD · D1 · Spot</span>
      </div>

      <div class="instrument__stage" data-reveal>
        <div class="instrument__strip" aria-hidden="true">${instrumentStripMarkup()}</div>
        <h2 class="instrument__symbol">GBP<span class="instrument__slash" aria-hidden="true"></span><span class="sr-only">/</span>USD</h2>
        <p class="instrument__price"><b data-price>1.2638</b><span>+0.42%</span></p>
      </div>

      <div class="instrument__stats" data-reveal>
        <div class="stat"><p class="stat__v">40<small>yrs</small></p><p class="stat__k">History</p></div>
        <div class="stat"><p class="stat__v">01</p><p class="stat__k">Instrument</p></div>
        <div class="stat"><p class="stat__v">D1</p><p class="stat__k">Timeframe</p></div>
        <div class="stat"><p class="stat__v">0.50<small>%</small></p><p class="stat__k">Risk per idea</p></div>
      </div>
    </div>
  </section>

  <section class="section guardrails" id="guardrails">
    <span class="guardrails__watermark" aria-hidden="true">Ọ</span>
    <div class="wrap">
      <div class="section__head section__head--split" data-reveal>
        <div>
          <p class="eyebrow"><span>04</span> Guardrails</p>
          <h2 class="section__title">Intelligence needs <em>constraints.</em></h2>
        </div>
        <p class="section__lead">Four rules. No exceptions.</p>
      </div>

      <div class="guardrails__grid">
        ${guardrails
          .map(
            ([title, desc], index) => `
          <article class="rule" data-reveal style="--d: ${index * 50}ms">
            <span class="rule__n">${String(index + 1).padStart(2, '0')}</span>
            <h3 class="rule__title">${title}</h3>
            <p class="rule__desc">${desc}</p>
          </article>`,
          )
          .join('')}
      </div>
    </div>
  </section>
</main>

<footer class="footer">
  <div class="wrap">
    <div class="footer__top">
      <div>
        <p class="footer__line">Wisdom, before the trade.</p>
        <p class="footer__sub">A private intelligence. Not a product.</p>
      </div>
      <div class="footer__meta">
        <span>Lagos, NG</span>
        <span data-clock>--:--</span>
        <span>Private node</span>
      </div>
    </div>
    <div class="footer__word" aria-hidden="true">ỌGBỌN</div>
    <div class="footer__fine">
      <span>© <span data-year>2026</span> ỌGBỌN</span>
      <span>GBP/USD · Daily</span>
      <span>Mark · Vite bolt</span>
    </div>
  </div>
</footer>
`

/* ------------------------------------------------------------------
   Canvas layers
   ------------------------------------------------------------------ */

const field = document.querySelector<HTMLCanvasElement>('[data-field]')
if (field) initMarketField(field)

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

    fields.get('bias')!.textContent = record.bias
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
   Clock, session, year
   ------------------------------------------------------------------ */

const clocks = Array.from(document.querySelectorAll<HTMLElement>('[data-clock]'))
const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Africa/Lagos',
})

function currentSession() {
  const now = new Date()
  const hour = now.getUTCHours() + now.getUTCMinutes() / 60

  if (hour >= 13 && hour < 17) return 'London · New York'
  if (hour >= 8 && hour < 17) return 'London'
  if (hour >= 13 && hour < 22) return 'New York'
  if (hour >= 0 && hour < 9) return 'Tokyo'
  return 'Sydney'
}

function updateTime() {
  const time = timeFormatter.format(new Date())
  clocks.forEach((clock) => {
    clock.textContent = time
  })

  const session = currentSession()
  document.querySelectorAll<HTMLElement>('[data-session]').forEach((el) => {
    el.textContent = session
  })
}

updateTime()
window.setInterval(updateTime, 20000)

document.querySelectorAll<HTMLElement>('[data-year]').forEach((el) => {
  el.textContent = String(new Date().getFullYear())
})

/* ------------------------------------------------------------------
   A quiet live tick on the price readouts
   ------------------------------------------------------------------ */

const priceEls = Array.from(document.querySelectorAll<HTMLElement>('[data-price]'))
let price = 1.2638

if (priceEls.length > 0) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!reduceMotion) {
    window.setInterval(() => {
      price = Math.max(1.24, Math.min(1.29, price + (Math.random() - 0.5) * 0.0009))
      const text = price.toFixed(4)
      priceEls.forEach((el) => {
        el.textContent = text
      })
    }, 3600)
  }
}
