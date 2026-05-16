import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Employee } from '../../types'
import { STATUS_COLORS, statusLabel } from '../../lib/graphStatus'
import type { MoonStatus } from '../../lib/graphStatus'
import {
  buildGraphData,
  type GraphLayoutId,
  type GraphExportPayload,
} from '../../lib/graphLayouts'
import { useSolarPhysics, type SolarNode } from './useSolarPhysics'
import GraphControlPanel, { type GraphPanelSettings } from './GraphControlPanel'

interface SolarSystemGraphProps {
  employee: Employee
}

const DEFAULT_SETTINGS: GraphPanelSettings = {
  layout: 'solar',
  showBurst: true,
  showSunLinks: true,
  labelsAlways: false,
  animationPaused: false,
}

function drawCurvedEdge(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  curvature: number,
  lineWidth: number,
  arrow = true,
) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const bulge = len * curvature * 0.35
  const cpx = mx + nx * bulge
  const cpy = my + ny * bulge

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(cpx, cpy, x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  ctx.stroke()

  if (arrow && len > 20) {
    const t = 0.92
    const ax = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpx + t * t * x2
    const ay = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpy + t * t * y2
    const angle = Math.atan2(y2 - ay, x2 - ax)
    const size = 5
    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - size * Math.cos(angle - 0.4), y2 - size * Math.sin(angle - 0.4))
    ctx.lineTo(x2 - size * Math.cos(angle + 0.4), y2 - size * Math.sin(angle + 0.4))
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
  }
}

export default function SolarSystemGraph({ employee }: SolarSystemGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const physics = useSolarPhysics()
  const navigate = useNavigate()

  const [hovered, setHovered] = useState<SolarNode | null>(null)
  const [settings, setSettings] = useState<GraphPanelSettings>(() => {
    try {
      const saved = localStorage.getItem(`aq-graph-${employee.id}`)
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    } catch {
      /* ignore */
    }
    return DEFAULT_SETTINGS
  })
  const hoveredRef = useRef<SolarNode | null>(null)
  const settingsRef = useRef(settings)
  const frozenTimeRef = useRef(0)

  const transformRef = useRef({ x: 0, y: 0, k: 1 })
  const isPanningRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const didDragRef = useRef(false)

  const graphKey = useMemo(
    () =>
      `${employee.id}-${employee.goals.length}-${settings.layout}-${settings.showBurst}-${settings.showSunLinks}`,
    [employee, settings.layout, settings.showBurst, settings.showSunLinks],
  )
  const initialized = useRef(false)

  useEffect(() => {
    settingsRef.current = settings
    localStorage.setItem(`aq-graph-${employee.id}`, JSON.stringify(settings))
  }, [settings, employee.id])

  const rebuildGraph = useCallback(() => {
    const { nodes, edges } = buildGraphData(employee, settings.layout, {
      showBurst: settings.showBurst,
      showSunLinks: settings.showSunLinks,
      burstCount: 10,
    })
    physics.init(nodes, edges)
  }, [employee, settings.layout, settings.showBurst, settings.showSunLinks, physics])

  const patchSettings = (patch: Partial<GraphPanelSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
    initialized.current = false
  }

  const toGraphCoords = useCallback((mx: number, my: number) => {
    const { x, y, k } = transformRef.current
    return { x: (mx - x) / k, y: (my - y) / k }
  }, [])

  const hitTest = useCallback(
    (mx: number, my: number) => {
      const nodes = physics.getNodes()
      const { x: gx, y: gy } = toGraphCoords(mx, my)
      const sorted = [...nodes].sort((a, b) => a.depth - b.depth)
      for (let i = sorted.length - 1; i >= 0; i--) {
        const n = sorted[i]
        const scale = 0.82 + n.depth * 0.28
        if (Math.hypot(gx - n.x, gy - n.y) < n.radius * scale + 8) return n
      }
      return null
    },
    [physics, toGraphCoords],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.width / dpr
    const H = canvas.height / dpr
    const now = performance.now() / 1000
    if (!settingsRef.current.animationPaused) frozenTimeRef.current = now
    const time = frozenTimeRef.current

    physics.step(0, 0, time)
    const nodes = physics.getNodes()
    const edges = physics.getEdges()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    ctx.save()
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    const { x, y, k } = transformRef.current
    const labelsAlways = settingsRef.current.labelsAlways
    const showMoonLabels = labelsAlways || k >= 0.9
    const showDetails = labelsAlways || k >= 1.3

    ctx.translate(x + W / 2, y + H / 2)
    ctx.scale(k, k)

    const sun = nodeMap.get('sun')
    if (sun) {
      const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, 120)
      glow.addColorStop(0, 'rgba(167, 139, 250, 0.25)')
      glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(sun.x - 120, sun.y - 120, 240, 240)
    }

    for (const e of edges) {
      if (e.burst) {
        const burst = e.burst
        const parent = nodeMap.get(e.from)
        if (!parent) continue
        const ex = parent.x + Math.cos(burst.angle) * burst.len
        const ey = parent.y + Math.sin(burst.angle) * burst.len
        drawCurvedEdge(ctx, parent.x, parent.y, ex, ey, e.color, e.curvature, 0.6, false)
        continue
      }
      const a = nodeMap.get(e.from)
      const b = nodeMap.get(e.to)
      if (!a || !b) continue
      const scaleA = 0.82 + a.depth * 0.28
      const scaleB = 0.82 + b.depth * 0.28
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const ux = (b.x - a.x) / dist
      const uy = (b.y - a.y) / dist
      const ax = a.x + ux * a.radius * scaleA
      const ay = a.y + uy * a.radius * scaleA
      const bx = b.x - ux * b.radius * scaleB
      const by = b.y - uy * b.radius * scaleB
      const showArrow = b.type === 'moon'
      drawCurvedEdge(ctx, ax, ay, bx, by, e.color, e.curvature, e.from === 'sun' ? 0.7 : 1.1, showArrow)
    }

    const sortedNodes = [...nodes].sort((a, b) => a.depth - b.depth)
    const hoveredNode = hoveredRef.current

    for (const n of sortedNodes) {
      const scale = 0.82 + n.depth * 0.28
      const r = n.radius * scale
      const isHover = hoveredNode?.id === n.id
      const alpha = 0.55 + n.depth * 0.45

      ctx.shadowColor = n.color
      ctx.shadowBlur = isHover ? 22 : 12
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = n.color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      if (n.type === 'sun' || n.type === 'planet') {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(103, 232, 249, ${0.15 + n.depth * 0.15})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      if (isHover) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 5, 0, Math.PI * 2)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      const showLabel =
        n.type === 'sun' ||
        n.type === 'planet' ||
        (n.type === 'moon' && showMoonLabels)

      if (!showLabel) continue

      ctx.fillStyle = `rgba(230, 245, 255, ${0.7 + n.depth * 0.3})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font =
        n.type === 'sun'
          ? `bold ${13 / k}px "DM Sans", sans-serif`
          : n.type === 'planet'
            ? `700 ${11 / k}px "DM Sans", sans-serif`
            : `500 ${9 / k}px "DM Sans", sans-serif`

      let text = n.label
      if (n.type === 'moon' && !showDetails && text.length > 12) {
        text = text.slice(0, 11) + '…'
      } else if (text.length > 16) {
        text = text.slice(0, 15) + '…'
      }

      ctx.fillText(text, n.x, n.y + r + 11 / k)
    }

    ctx.restore()
    animRef.current = requestAnimationFrame(draw)
  }, [physics])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = wrapper.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
      if (!initialized.current) {
        rebuildGraph()
        initialized.current = true
      }
    }

    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(draw)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left - rect.width / 2
      const my = e.clientY - rect.top - rect.height / 2
      const { x, y, k } = transformRef.current
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08
      const newK = Math.max(0.3, Math.min(k * zoomFactor, 4))
      const ratio = newK / k
      transformRef.current = {
        k: newK,
        x: mx - (mx - x) * ratio,
        y: my - (my - y) * ratio,
      }
    }

    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('wheel', onWheel)
      cancelAnimationFrame(animRef.current)
    }
  }, [graphKey, employee, physics, draw, rebuildGraph])

  useEffect(() => {
    initialized.current = false
  }, [graphKey])

  const getMouse = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      mx: e.clientX - rect.left - rect.width / 2,
      my: e.clientY - rect.top - rect.height / 2,
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mx, my } = getMouse(e)
    const hit = hitTest(mx, my)
    didDragRef.current = false

    if (hit && !hit.fixed) {
      const { x: gx, y: gy } = toGraphCoords(mx, my)
      physics.startDrag(hit.id, gx, gy)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    } else {
      isPanningRef.current = true
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mx, my } = getMouse(e)

    if (physics.isDragging()) {
      didDragRef.current = true
      const { x: gx, y: gy } = toGraphCoords(mx, my)
      physics.drag(gx, gy)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    } else if (isPanningRef.current) {
      didDragRef.current = true
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      transformRef.current.x += dx
      transformRef.current.y += dy
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
    } else {
      const hit = hitTest(mx, my)
      hoveredRef.current = hit
      setHovered(hit)
      if (canvasRef.current) canvasRef.current.style.cursor = hit && !hit.fixed ? 'grab' : 'default'
    }
  }

  const handleMouseUp = () => {
    physics.endDrag()
    isPanningRef.current = false
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredRef.current ? 'grab' : 'default'
    }
  }

  const handleClick = () => {
    if (didDragRef.current) return
    if (hovered?.type === 'moon') navigate('/my-goals')
  }

  const moonMeta = hovered?.meta as { goal: { thrustArea: string }; status: MoonStatus } | undefined

  const handleExportJson = () => {
    const nodes = physics.getNodes()
    const payload: GraphExportPayload = {
      version: 1,
      employeeId: employee.id,
      layout: settings.layout,
      settings: {
        showBurst: settings.showBurst,
        showSunLinks: settings.showSunLinks,
        burstCount: 10,
        labelsAlways: settings.labelsAlways,
        animationPaused: settings.animationPaused,
      },
      transform: { ...transformRef.current },
      nodes: nodes.map((n) => ({
        id: n.id,
        x: n.x,
        y: n.y,
        baseDistance: n.baseDistance,
        baseAngle: n.baseAngle,
      })),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `atomquest-graph-${employee.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as GraphExportPayload
      if (data.employeeId && data.employeeId !== employee.id) {
        const ok = window.confirm('This graph was saved for a different user. Import anyway?')
        if (!ok) return
      }
      setSettings((s) => ({
        ...s,
        layout: data.layout ?? s.layout,
        showBurst: data.settings?.showBurst ?? s.showBurst,
        showSunLinks: data.settings?.showSunLinks ?? s.showSunLinks,
        labelsAlways: data.settings?.labelsAlways ?? s.labelsAlways,
        animationPaused: data.settings?.animationPaused ?? s.animationPaused,
      }))
      initialized.current = false
      rebuildGraph()
      if (data.transform) transformRef.current = { ...data.transform }
      if (data.nodes?.length) {
        const current = physics.getNodes()
        for (const saved of data.nodes) {
          const n = current.find((x) => x.id === saved.id)
          if (n) {
            n.x = saved.x
            n.y = saved.y
            n.baseDistance = saved.baseDistance
            n.baseAngle = saved.baseAngle
          }
        }
      }
    } catch {
      window.alert('Invalid graph file. Please upload a valid JSON export.')
    }
  }

  const handleExportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `atomquest-graph-${Date.now()}.png`
    a.click()
  }

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute left-4 top-4 z-10 max-w-[220px] rounded-xl border border-cyan-500/20 bg-black/70 p-4 backdrop-blur-md sm:left-6 sm:top-6">
        <h2 className="font-heading text-base font-bold text-cyan-300 sm:text-lg">Neuron map</h2>
        <p className="text-xs text-slate-400 sm:text-sm">{employee.name} · drag nodes to explore</p>
        <ul className="mt-3 flex flex-col gap-1.5 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.complete }} />
            Completed
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.partial }} />
            In progress
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.error }} />
            At risk
          </li>
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.untouched }} />
            Untouched
          </li>
        </ul>
        <p className="mt-3 text-[10px] italic text-slate-500">
          Drag nodes · spring back on release
        </p>
      </div>

      <GraphControlPanel
        settings={settings}
        onSettingsChange={patchSettings}
        onResetView={() => {
          transformRef.current = { x: 0, y: 0, k: 1 }
        }}
        onFitView={() => {
          transformRef.current = { x: 0, y: 0, k: 0.85 }
        }}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onExportPng={handleExportPng}
      />

      <canvas
        ref={canvasRef}
        className="block h-full w-full outline-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />

      {hovered?.type === 'moon' && moonMeta && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 max-w-xs rounded-xl border border-cyan-500/30 bg-black/85 p-4 backdrop-blur-md sm:bottom-6 sm:right-6">
          <p className="text-sm font-medium text-cyan-100">{hovered.label}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">
              {moonMeta.goal.thrustArea}
            </span>
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">
              {statusLabel(moonMeta.status)}
            </span>
          </div>
          <p className="mt-3 text-xs text-cyan-400/80">Click to open goals →</p>
        </div>
      )}
    </div>
  )
}
