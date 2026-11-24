type Candle = {
  x: number
  open: number
  close: number
  high: number
  low: number
}

/**
 * A slow, low-contrast market field behind the hero.
 * Not a live chart — a texture that speaks the language of the system.
 */
export function initMarketField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const spacing = 16

  let width = 0
  let height = 0
  let candles: Candle[] = []
  let areaFill: CanvasGradient | null = null
  let frame = 0
  let lastDraw = 0

  const yFor = (price: number) => height * (0.2 + (1 - price) * 0.6)

  function seed() {
    const count = Math.ceil(width / spacing) + 12
    candles = []
    let price = 0.5

    for (let i = 0; i < count; i++) {
      const open = price
      const drift = (Math.random() - 0.46) * 0.055
      const close = Math.min(0.92, Math.max(0.08, open + drift))
      const high = Math.min(0.98, Math.max(open, close) + Math.random() * 0.035)
      const low = Math.max(0.02, Math.min(open, close) - Math.random() * 0.035)

      candles.push({ x: i * spacing, open, close, high, low })
      price = close
    }

    areaFill = ctx!.createLinearGradient(0, 0, 0, height)
    areaFill.addColorStop(0, 'rgba(139, 92, 246, 0.13)')
    areaFill.addColorStop(1, 'rgba(139, 92, 246, 0)')
  }

  function draw(time: number) {
    if (!width || !height) return

    ctx!.clearRect(0, 0, width, height)

    // Faint horizontal structure.
    ctx!.lineWidth = 1
    ctx!.strokeStyle = 'rgba(242, 238, 230, 0.035)'
    for (let y = height * 0.16; y < height; y += height * 0.13) {
      ctx!.beginPath()
      ctx!.moveTo(0, y)
      ctx!.lineTo(width, y)
      ctx!.stroke()
    }

    const sway = reduceMotion ? 0 : Math.sin(time * 0.00006) * spacing * 2.5

    ctx!.save()
    ctx!.translate(-sway, 0)

    const bodyWidth = Math.max(3, spacing * 0.34)

    for (const candle of candles) {
      const up = candle.close >= candle.open
      const x = candle.x + spacing / 2

      ctx!.lineWidth = 1
      ctx!.strokeStyle = up ? 'rgba(185, 140, 255, 0.16)' : 'rgba(255, 106, 77, 0.1)'
      ctx!.beginPath()
      ctx!.moveTo(x, yFor(candle.high))
      ctx!.lineTo(x, yFor(candle.low))
      ctx!.stroke()

      ctx!.fillStyle = up ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 106, 77, 0.06)'
      const top = yFor(Math.max(candle.open, candle.close))
      const bottom = yFor(Math.min(candle.open, candle.close))
      ctx!.fillRect(x - bodyWidth / 2, top, bodyWidth, Math.max(1.5, bottom - top))
    }

    // The line: a single path through the closes.
    const first = candles[0]
    const last = candles[candles.length - 1]
    if (!first || !last) {
      ctx!.restore()
      return
    }

    ctx!.beginPath()
    candles.forEach((candle, index) => {
      const x = candle.x + spacing / 2
      const y = yFor(candle.close)
      if (index === 0) ctx!.moveTo(x, y)
      else ctx!.lineTo(x, y)
    })

    // Soft area under the line.
    ctx!.save()
    ctx!.lineTo(last.x + spacing / 2, height)
    ctx!.lineTo(first.x + spacing / 2, height)
    ctx!.closePath()
    if (areaFill) {
      ctx!.fillStyle = areaFill
      ctx!.fill()
    }
    ctx!.restore()

    // Redraw the line, glowing.
    ctx!.beginPath()
    candles.forEach((candle, index) => {
      const x = candle.x + spacing / 2
      const y = yFor(candle.close)
      if (index === 0) ctx!.moveTo(x, y)
      else ctx!.lineTo(x, y)
    })
    ctx!.strokeStyle = 'rgba(185, 140, 255, 0.5)'
    ctx!.lineWidth = 1.4
    ctx!.shadowColor = 'rgba(124, 58, 237, 0.85)'
    ctx!.shadowBlur = 18
    ctx!.stroke()

    ctx!.restore()
    ctx!.shadowBlur = 0
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

    seed()
    draw(0)
  }

  function loop(time: number) {
    if (time - lastDraw > 1000 / 30) {
      draw(time)
      lastDraw = time
    }
    frame = requestAnimationFrame(loop)
  }

  const observer = new ResizeObserver(resize)
  observer.observe(canvas)
  resize()

  if (!reduceMotion) {
    frame = requestAnimationFrame(loop)
  }

  window.addEventListener(
    'pagehide',
    () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    },
    { once: true },
  )
}
