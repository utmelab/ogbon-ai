/* ============================================================
   ỌGBỌN — the intelligence core.
   A rotating neural sphere drawn on canvas: nodes, edges,
   instrument rings, a scanning arc. Pure canvas, no deps.
   ============================================================ */

type Tone = 'violet' | 'cyan' | 'ember'

type Node = {
  x: number
  y: number
  z: number
  phase: number
  tone: Tone
}

type Edge = {
  a: number
  b: number
}

const TONES: Record<Tone, [number, number, number]> = {
  violet: [167, 139, 250],
  cyan: [34, 211, 238],
  ember: [255, 106, 77],
}

const rgba = (tone: Tone, alpha: number) => {
  const [r, g, b] = TONES[tone]
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function initNeuralCore(canvas: HTMLCanvasElement) {
  const context = canvas.getContext('2d')
  if (!context) return
  const ctx = context

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const COUNT = 148

  let width = 0
  let height = 0
  let cx = 0
  let cy = 0
  let radius = 0

  let nodes: Node[] = []
  let edges: Edge[] = []
  let frame = 0
  let lastDraw = 0

  const golden = Math.PI * (3 - Math.sqrt(5))

  function build() {
    nodes = []
    edges = []

    for (let i = 0; i < COUNT; i++) {
      const y = 1 - (i / (COUNT - 1)) * 2
      const ring = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i
      const tone: Tone = i % 13 === 0 ? 'ember' : i % 4 === 0 ? 'cyan' : 'violet'

      nodes.push({
        x: Math.cos(theta) * ring,
        y,
        z: Math.sin(theta) * ring,
        phase: Math.random() * Math.PI * 2,
        tone,
      })
    }

    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const a = nodes[i]!
        const b = nodes[j]!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dz = a.z - b.z
        if (dx * dx + dy * dy + dz * dz < 0.15) edges.push({ a: i, b: j })
      }
    }
  }

  function draw(time: number) {
    if (!width || !height) return

    ctx.clearRect(0, 0, width, height)

    const t = time * 0.001
    const spin = reduceMotion ? 0.7 : t * 0.22
    const tilt = -0.42
    const cosY = Math.cos(spin)
    const sinY = Math.sin(spin)
    const cosX = Math.cos(tilt)
    const sinX = Math.sin(tilt)

    // ---- halo -------------------------------------------------
    const halo = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius * 1.5)
    halo.addColorStop(0, 'rgba(124, 58, 237, 0.28)')
    halo.addColorStop(0.34, 'rgba(91, 33, 182, 0.12)')
    halo.addColorStop(0.66, 'rgba(34, 211, 238, 0.05)')
    halo.addColorStop(1, 'rgba(5, 6, 10, 0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2)
    ctx.fill()

    // ---- instrument rings -------------------------------------
    const ringSpin = reduceMotion ? 0 : t * 0.06
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(ringSpin)

    for (let i = 0; i < 3; i++) {
      const r = radius * (1.12 + i * 0.11)
      ctx.beginPath()
      ctx.ellipse(0, 0, r, r * (0.98 - i * 0.02), 0, 0, Math.PI * 2)
      ctx.strokeStyle = i === 0 ? 'rgba(167, 139, 250, 0.22)' : 'rgba(148, 163, 184, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // tick marks around the outermost ring
    const ticks = 72
    for (let i = 0; i < ticks; i++) {
      const angle = (i / ticks) * Math.PI * 2
      const major = i % 6 === 0
      const inner = radius * (major ? 1.3 : 1.33)
      const outer = radius * 1.36
      ctx.beginPath()
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner)
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer)
      ctx.strokeStyle = major ? 'rgba(167, 139, 250, 0.35)' : 'rgba(148, 163, 184, 0.16)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    ctx.restore()

    // scanning arc
    if (!reduceMotion) {
      const scanAngle = t * 0.9
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(scanAngle)
      ctx.beginPath()
      ctx.arc(0, 0, radius * 1.34, -0.22, 0.22)
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)'
      ctx.lineWidth = 1.5
      ctx.shadowColor = 'rgba(34, 211, 238, 0.8)'
      ctx.shadowBlur = 14
      ctx.stroke()
      ctx.restore()
      ctx.shadowBlur = 0
    }

    // ---- project nodes ----------------------------------------
    const projected = nodes.map((node) => {
      const x1 = node.x * cosY + node.z * sinY
      const z1 = -node.x * sinY + node.z * cosY
      const y2 = node.y * cosX - z1 * sinX
      const z2 = node.y * sinX + z1 * cosX
      const depth = (z2 + 1) / 2 // 0 = far, 1 = near
      const scale = 0.72 + depth * 0.42

      return {
        sx: cx + x1 * radius * scale,
        sy: cy + y2 * radius * scale,
        depth,
        scale,
        tone: node.tone,
        phase: node.phase,
      }
    })

    // ---- edges -------------------------------------------------
    ctx.lineWidth = 1
    for (const edge of edges) {
      const a = projected[edge.a]
      const b = projected[edge.b]
      if (!a || !b) continue
      const depth = (a.depth + b.depth) / 2
      if (depth < 0.24) continue
      ctx.beginPath()
      ctx.moveTo(a.sx, a.sy)
      ctx.lineTo(b.sx, b.sy)
      ctx.strokeStyle = `rgba(140, 150, 255, ${0.035 + depth * 0.14})`
      ctx.stroke()
    }

    // ---- nodes (far to near) ----------------------------------
    const ordered = [...projected].sort((a, b) => a.depth - b.depth)
    for (const node of ordered) {
      const pulse = reduceMotion ? 0.7 : 0.55 + Math.sin(t * 1.6 + node.phase) * 0.35
      const r = (1.1 + node.depth * 2.1) * (0.85 + pulse * 0.3)
      const alpha = 0.22 + node.depth * 0.65

      if (node.depth > 0.7) {
        ctx.beginPath()
        ctx.arc(node.sx, node.sy, r * 3.4, 0, Math.PI * 2)
        ctx.fillStyle = rgba(node.tone, 0.06 * node.depth)
        ctx.fill()
      }

      ctx.beginPath()
      ctx.arc(node.sx, node.sy, r, 0, Math.PI * 2)
      ctx.fillStyle = rgba(node.tone, alpha)
      ctx.fill()
    }

    // ---- core --------------------------------------------------
    const corePulse = reduceMotion ? 0.5 : 0.5 + Math.sin(t * 1.1) * 0.1
    const coreR = radius * (0.16 + corePulse * 0.06)
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6)
    core.addColorStop(0, 'rgba(237, 233, 254, 0.92)')
    core.addColorStop(0.18, 'rgba(196, 181, 253, 0.55)')
    core.addColorStop(0.46, 'rgba(124, 58, 237, 0.24)')
    core.addColorStop(1, 'rgba(34, 211, 238, 0)')
    ctx.fillStyle = core
    ctx.beginPath()
    ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2)
    ctx.fill()

    // faint crosshair through the core
    ctx.strokeStyle = 'rgba(103, 232, 249, 0.18)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 8])
    ctx.beginPath()
    ctx.moveTo(cx - radius * 1.4, cy)
    ctx.lineTo(cx + radius * 1.4, cy)
    ctx.moveTo(cx, cy - radius * 1.4)
    ctx.lineTo(cx, cy + radius * 1.4)
    ctx.stroke()
    ctx.setLineDash([])
  }

  function resize() {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

    cx = width / 2
    cy = height / 2
    radius = Math.min(width, height) * 0.305

    build()
    draw(0)
  }

  function loop(time: number) {
    if (time - lastDraw > 1000 / 32) {
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
