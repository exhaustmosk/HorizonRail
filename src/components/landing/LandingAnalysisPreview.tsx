import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const MOONS = [
  { label: 'ARR +15%', color: '#22c55e', orbit: 118, speed: 0.35, phase: 0, size: 9 },
  { label: 'NPS 72', color: '#eab308', orbit: 118, speed: 0.35, phase: 1.8, size: 8 },
  { label: 'Churn 2%', color: '#ef4444', orbit: 118, speed: 0.35, phase: 3.4, size: 7 },
  { label: 'Features', color: '#c4b5fd', orbit: 118, speed: 0.35, phase: 4.9, size: 7 },
  { label: 'Q2 plan', color: '#38bdf8', orbit: 168, speed: -0.22, phase: 0.6, size: 6 },
  { label: 'Tasks', color: '#a78bfa', orbit: 168, speed: -0.22, phase: 2.9, size: 6 },
] as const

export default function LandingAnalysisPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let t = 0
    const dpr = window.devicePixelRatio || 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      const cx = w / 2
      const cy = h / 2
      t += 0.016

      ctx.clearRect(0, 0, w, h)

      // Ambient grid
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.08)'
      ctx.lineWidth = 1
      for (let i = 0; i < w; i += 28) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, h)
        ctx.stroke()
      }
      for (let j = 0; j < h; j += 28) {
        ctx.beginPath()
        ctx.moveTo(0, j)
        ctx.lineTo(w, j)
        ctx.stroke()
      }

      // Pulsing rings
      for (let r = 0; r < 3; r++) {
        const radius = 55 + r * 42 + Math.sin(t * 1.2 + r) * 4
        ctx.beginPath()
        ctx.arc(cx, cy, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.15 + r * 0.06})`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Orbit paths + moons
      const nodes: { x: number; y: number; color: string; size: number }[] = []
      MOONS.forEach((m) => {
        const angle = t * m.speed + m.phase
        const x = cx + Math.cos(angle) * m.orbit
        const y = cy + Math.sin(angle) * m.orbit * 0.72
        nodes.push({ x, y, color: m.color, size: m.size })

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(x, y)
        const grad = ctx.createLinearGradient(cx, cy, x, y)
        grad.addColorStop(0, 'rgba(167, 139, 250, 0.45)')
        grad.addColorStop(1, m.color + '99')
        ctx.strokeStyle = grad
        ctx.lineWidth = 1.2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, m.size, 0, Math.PI * 2)
        ctx.fillStyle = m.color
        ctx.shadowColor = m.color
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      })

      // Center hub
      const pulse = 1 + Math.sin(t * 2) * 0.06
      ctx.beginPath()
      ctx.arc(cx, cy, 28 * pulse, 0, Math.PI * 2)
      const hubGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 32)
      hubGrad.addColorStop(0, '#a78bfa')
      hubGrad.addColorStop(1, '#5b21b6')
      ctx.fillStyle = hubGrad
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 11px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('YOU', cx, cy)



      // Mini planned vs actual bars (bottom-right HUD)
      const bx = w - 108
      const by = h - 72
      ctx.fillStyle = 'rgba(15, 12, 28, 0.85)'
      ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      const r = 8
      ctx.moveTo(bx + r, by)
      ctx.lineTo(bx + 96 - r, by)
      ctx.quadraticCurveTo(bx + 96, by, bx + 96, by + r)
      ctx.lineTo(bx + 96, by + 56 - r)
      ctx.quadraticCurveTo(bx + 96, by + 56, bx + 96 - r, by + 56)
      ctx.lineTo(bx + r, by + 56)
      ctx.quadraticCurveTo(bx, by + 56, bx, by + 56 - r)
      ctx.lineTo(bx, by + r)
      ctx.quadraticCurveTo(bx, by, bx + r, by)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = 'rgba(196, 181, 253, 0.9)'
      ctx.font = '600 9px system-ui'
      ctx.textAlign = 'left'
      ctx.fillText('Planned vs Actual', bx + 8, by + 14)
      const bars = [
        { planned: 0.7, actual: 0.55 + Math.sin(t) * 0.08, label: 'Q1' },
        { planned: 0.65, actual: 0.72 + Math.sin(t + 1) * 0.06, label: 'Q2' },
      ]
      bars.forEach((b, i) => {
        const y0 = by + 24 + i * 16
        ctx.fillStyle = 'rgba(124, 58, 237, 0.5)'
        ctx.fillRect(bx + 8, y0, 50 * b.planned, 5)
        ctx.fillStyle = '#22c55e'
        ctx.fillRect(bx + 8, y0 + 7, 50 * b.actual, 5)
        ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'
        ctx.font = '8px system-ui'
        ctx.fillText(b.label, bx + 64, y0 + 8)
      })

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg">
      <motion.div
        className="absolute -inset-4 rounded-full bg-accent-violet/20 blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute inset-0 rounded-3xl border border-purple/50 bg-bg-card/40 shadow-2xl backdrop-blur-md"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <canvas ref={canvasRef} className="h-full w-full rounded-3xl" />
        <div className="pointer-events-none absolute left-4 top-4 flex gap-2">
          {['Live graph', 'Check-in sync'].map((tag, i) => (
            <motion.span
              key={tag}
              className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-medium text-violet-200"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.4 }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
