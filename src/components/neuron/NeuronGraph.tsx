import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Employee } from '../../types'
import { STATUS_COLORS, statusLabel } from '../../lib/graphStatus'
import {
  buildNeuronGraph,
  normalizeLayoutId,
  normalizeSpacingId,
  type GraphExportPayload,
  type NeuronGraphMode,
  type NodeMeta,
} from '../../lib/neuronGraph'
import { getTreeBounds } from '../../lib/layeredTreeLayout'
import { buildEmployeeTasks } from '../../lib/employeeTasks'
import { computeWeightedScore } from '../../lib/scoreEngine'
import { useSolarPhysics, type SolarNode } from './useSolarPhysics'
import GraphControlPanel, { type GraphPanelSettings } from './GraphControlPanel'
import { drawEdge } from './graphDraw'

const DEFAULT_SETTINGS: GraphPanelSettings = {
  layout: 'default',
  spacing: 'normal',
  showBurst: false,
  showSunLinks: false,
  labelsAlways: false,
  animationPaused: true,
}

const DEFAULT_TRANSFORM: Record<NeuronGraphMode, { x: number; y: number; k: number }> = {
  personal: { x: 0, y: 0, k: 0.9 },
  team: { x: 0, y: 0, k: 0.52 },
  company: { x: 0, y: 0, k: 0.42 },
}

export type NeuronGraphProps =
  | { mode: 'personal'; employee: Employee }
  | {
      mode: 'team'
      manager: Employee
      reports: Employee[]
      companyName?: string
    }
  | {
      mode: 'company'
      employees: Employee[]
      companyName: string
    }


export default function NeuronGraph(props: NeuronGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const physics = useSolarPhysics()
  const navigate = useNavigate()

  const storageId = useMemo(() => {
    if (props.mode === 'personal') return `personal-${props.employee.id}`
    if (props.mode === 'team') return `team-${props.manager.id}`
    return 'company'
  }, [
    props.mode,
    props.mode === 'personal' ? props.employee.id : '',
    props.mode === 'team' ? props.manager.id : '',
  ])

  const [hovered, setHovered] = useState<SolarNode | null>(null)
  const [settings, setSettings] = useState<GraphPanelSettings>(() => {
    try {
      const saved = localStorage.getItem(`aq-graph-${storageId}`)
      if (saved) {
        const parsed = JSON.parse(saved) as GraphPanelSettings
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          layout: normalizeLayoutId(parsed.layout),
          spacing: normalizeSpacingId(parsed.spacing),
          showBurst: false,
          showSunLinks: false,
        }
      }
    } catch {
      /* ignore */
    }
    return DEFAULT_SETTINGS
  })

  const hoveredRef = useRef<SolarNode | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const propsRef = useRef(props)
  propsRef.current = props
  const drawRef = useRef<() => void>(() => {})
  const rebuildGraphRef = useRef<() => void>(() => {})
  const settingsRef = useRef(settings)
  const frozenTimeRef = useRef(0)
  const transformRef = useRef({ ...DEFAULT_TRANSFORM[props.mode] })
  const isPanningRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const didDragRef = useRef(false)
  const initialized = useRef(false)

  const graphKey = useMemo(() => {
    if (props.mode === 'personal') {
      const e = props.employee
      return `personal-${e.id}-${e.goals.length}-${settings.layout}-${settings.spacing}-${settings.showBurst}`
    }
    if (props.mode === 'team') {
      return `team-${props.manager.id}-${props.reports.map((r) => r.id + r.goals.length).join(',')}-${settings.layout}-${settings.spacing}`
    }
    return `company-${props.employees.map((e) => e.id).join(',')}-${settings.layout}-${settings.spacing}`
  }, [props, settings.layout, settings.spacing, settings.showBurst])

  useEffect(() => {
    settingsRef.current = settings
    localStorage.setItem(`aq-graph-${storageId}`, JSON.stringify(settings))
  }, [settings, storageId])

  const rebuildGraph = useCallback(() => {
    const burstCount = 10
    const layout = settings.layout
    const spacing = settings.spacing
    const config =
      props.mode === 'personal'
        ? {
            mode: 'personal' as const,
            employee: props.employee,
            layout,
            spacing,
            options: {
              showBurst: settings.showBurst,
              showSunLinks: settings.showSunLinks,
              burstCount,
            },
          }
        : props.mode === 'team'
          ? {
              mode: 'team' as const,
              manager: props.manager,
              reports: props.reports,
              layout,
              spacing,
              options: { showBurst: false, showSunLinks: false, burstCount: 0 },
            }
          : {
              mode: 'company' as const,
              employees: props.employees,
              companyName: props.companyName,
              layout,
              spacing,
              options: { showBurst: false, showSunLinks: false, burstCount: 0 },
            }
    const { nodes, edges } = buildNeuronGraph(config)
    const useTree = layout === 'default' && nodes.some((n) => n.layer !== undefined)
    physics.init(nodes, edges, {
      layoutId: settings.layout,
      useTreeLayout: useTree,
      polarFromCenter: layout === 'circular',
    })

    if (useTree) {
      const b = getTreeBounds(nodes)
      if (b.width > 0 && b.height > 0) {
        const k = DEFAULT_TRANSFORM[props.mode].k
        const cx = (b.minX + b.maxX) / 2
        const cy = (b.minY + b.maxY) / 2
        transformRef.current = { x: -cx * k, y: -cy * k, k }
      }
    } else if (layout === 'circular') {
      let maxR = 100
      for (const n of nodes) {
        maxR = Math.max(maxR, n.baseDistance + n.radius + 56)
      }
      const baseK = DEFAULT_TRANSFORM[props.mode].k
      const k = baseK * Math.min(1.15, 320 / maxR)
      transformRef.current = { x: 0, y: 0, k }
    }
  }, [props, settings.layout, settings.spacing, settings.showBurst, settings.showSunLinks, physics])

  rebuildGraphRef.current = rebuildGraph

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
    const time = frozenTimeRef.current

    physics.step(0, 0, time)
    const nodes = physics.getNodes()
    const edges = physics.getEdges()
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))

    ctx.save()
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    const mode = propsRef.current.mode
    const { x, y, k } = transformRef.current
    const labelsAlways = settingsRef.current.labelsAlways
    const showMoonLabels = labelsAlways || k >= (mode === 'company' ? 1.05 : 0.9)
    const showDetails = labelsAlways || k >= 1.3

    ctx.translate(x + W / 2, y + H / 2)
    ctx.scale(k, k)

    const sun = nodeMap.get('sun')
    if (sun) {
      const glowR = mode === 'company' ? 140 : 120
      const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, glowR)
      glow.addColorStop(0, 'rgba(167, 139, 250, 0.25)')
      glow.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)')
      glow.addColorStop(1, 'transparent')
      ctx.fillStyle = glow
      ctx.fillRect(sun.x - glowR, sun.y - glowR, glowR * 2, glowR * 2)
    }

    for (const e of edges) {
      if (e.burst) {
        const parent = nodeMap.get(e.from)
        if (!parent) continue
        const ex = parent.x + Math.cos(e.burst.angle) * e.burst.len
        const ey = parent.y + Math.sin(e.burst.angle) * e.burst.len
        drawEdge(ctx, parent.x, parent.y, ex, ey, e.color, 0.6, false)
        continue
      }
      const a = nodeMap.get(e.from)
      const b = nodeMap.get(e.to)
      if (!a || !b) continue
      const scaleA = 0.88 + a.depth * 0.12
      const scaleB = 0.88 + b.depth * 0.12
      const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1
      const ux = (b.x - a.x) / dist
      const uy = (b.y - a.y) / dist
      const ax = a.x + ux * a.radius * scaleA
      const ay = a.y + uy * a.radius * scaleA
      const bx = b.x - ux * b.radius * scaleB
      const by = b.y - uy * b.radius * scaleB
      const leafTarget = b.isLeaf === true
      drawEdge(ctx, ax, ay, bx, by, e.color, leafTarget ? 0.9 : 0.55, leafTarget)
    }

    const hoveredNode = hoveredRef.current
    for (const n of [...nodes].sort((a, b) => a.depth - b.depth)) {
      const scale = 0.88 + n.depth * 0.12
      const r = n.radius * scale
      const isHover = hoveredNode?.id === n.id
      const meta = n.meta as NodeMeta | undefined

      ctx.shadowColor = n.color
      ctx.shadowBlur = isHover ? 22 : 12
      ctx.beginPath()
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
      ctx.fillStyle = n.color
      ctx.globalAlpha = 0.55 + n.depth * 0.45
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0

      if (!n.isLeaf) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(196, 181, 253, 0.35)'
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

      const showPersonLabel =
        n.type === 'sun' ||
        n.type === 'planet' ||
        (meta?.kind === 'employee' && k >= 0.55) ||
        (meta?.kind === 'manager' && !n.isLeaf && k >= 0.5)
      const showHubLabel = meta?.kind === 'hub' && (labelsAlways || k >= 0.72)
      const showSatelliteLabel =
        (meta?.kind === 'goal' || meta?.kind === 'task') && showMoonLabels

      if (!showPersonLabel && !showHubLabel && !showSatelliteLabel) continue

      ctx.fillStyle = `rgba(230, 245, 255, ${0.7 + n.depth * 0.3})`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font =
        n.type === 'sun'
          ? `bold ${13 / k}px "DM Sans", sans-serif`
          : n.type === 'planet'
            ? `700 ${11 / k}px "DM Sans", sans-serif`
            : `500 ${(showSatelliteLabel ? 8 : 9) / k}px "DM Sans", sans-serif`

      let text = n.label
      if (meta?.kind === 'goal' || meta?.kind === 'task') {
        if (!showDetails && text.length > 12) text = text.slice(0, 11) + '…'
      } else if (text.length > 16) {
        text = text.slice(0, 15) + '…'
      }

      const labelY =
        meta?.kind === 'hub' || n.type === 'sun' || n.type === 'planet'
          ? n.y + r + 14 / k
          : n.y + r + 10 / k
      ctx.fillText(text, n.x, labelY)
    }

    ctx.restore()
    animRef.current = requestAnimationFrame(() => drawRef.current())
  }, [physics])

  drawRef.current = draw

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
        rebuildGraphRef.current()
        initialized.current = true
      }
    }

    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(() => drawRef.current())

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left - rect.width / 2
      const my = e.clientY - rect.top - rect.height / 2
      const { x, y, k } = transformRef.current
      const mode = propsRef.current.mode
      const maxK = mode === 'company' ? 3 : 4
      const minK = mode === 'company' ? 0.25 : 0.3
      const zoomFactor = e.deltaY < 0 ? 1.08 : 1 / 1.08
      const newK = Math.max(minK, Math.min(k * zoomFactor, maxK))
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
  }, [graphKey])

  useEffect(() => {
    initialized.current = false
    rebuildGraphRef.current()
    initialized.current = true
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
      return
    }
    if (isPanningRef.current) {
      didDragRef.current = true
      const dx = e.clientX - lastMouseRef.current.x
      const dy = e.clientY - lastMouseRef.current.y
      transformRef.current.x += dx
      transformRef.current.y += dy
      lastMouseRef.current = { x: e.clientX, y: e.clientY }
      return
    }
    const hit = hitTest(mx, my)
    hoveredRef.current = hit
    const nextId = hit?.id ?? null
    if (nextId !== hoveredIdRef.current) {
      hoveredIdRef.current = nextId
      setHovered(hit)
    }
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hit && !hit.fixed ? 'grab' : 'default'
    }
  }

  const handleMouseUp = () => {
    physics.endDrag()
    isPanningRef.current = false
    if (canvasRef.current) {
      canvasRef.current.style.cursor = hoveredRef.current && !hoveredRef.current.fixed ? 'grab' : 'default'
    }
  }

  const handleClick = () => {
    if (didDragRef.current) return
    const meta = hovered?.meta as NodeMeta | undefined
    if (meta?.kind === 'goal' || meta?.kind === 'task') navigate('/my-goals')
  }

  const meta = hovered?.meta as NodeMeta | undefined
  const hoverEmployee =
    meta?.kind === 'employee'
      ? meta.employee
      : meta?.kind === 'goal' || meta?.kind === 'task'
        ? meta.employee
        : meta?.kind === 'manager'
          ? meta.employee
          : null

  const title =
    props.mode === 'personal'
      ? `${props.employee.name} · your workspace`
      : props.mode === 'team'
        ? `${props.manager.name} · direct reports`
        : `${props.companyName} · org tree`

  const panelTitle =
    props.mode === 'personal'
      ? 'Neuron map'
      : props.mode === 'team'
        ? 'Team neuron map'
        : 'Company neuron map'

  const handleExportJson = () => {
    const nodes = physics.getNodes()
    const payload: GraphExportPayload = {
      version: 2,
      mode: props.mode,
      graphId: storageId,
      layout: settings.layout,
      spacing: settings.spacing,
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
    a.download = `atomquest-graph-${storageId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text) as GraphExportPayload & {
        employeeId?: string
        version?: number
      }
      if (data.graphId && data.graphId !== storageId) {
        const ok = window.confirm('This graph was saved for a different view. Import anyway?')
        if (!ok) return
      }
      setSettings((s) => ({
        ...s,
        layout: normalizeLayoutId(data.layout ?? s.layout),
        spacing: normalizeSpacingId(
          (data as GraphExportPayload & { spacing?: string }).spacing ?? s.spacing,
        ),
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
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `atomquest-graph-${Date.now()}.png`
    a.click()
  }

  const moonMeta = meta?.kind === 'goal' ? meta : meta?.kind === 'task' ? meta : null

  return (
    <div ref={wrapperRef} className="relative h-full w-full overflow-hidden bg-black">
      <div className="absolute left-4 top-4 z-10 max-w-[280px] rounded-xl border border-cyan-500/20 bg-black/70 p-4 backdrop-blur-md sm:left-6 sm:top-6">
        <h2 className="font-heading text-base font-bold text-cyan-300 sm:text-lg">{panelTitle}</h2>
        <p className="text-xs text-slate-400 sm:text-sm">{title}</p>
        <ul className="mt-3 flex flex-col gap-1.5 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS.complete }} />
            {props.mode === 'personal' ? 'Completed' : 'On track (80%+)'}
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
            {props.mode === 'personal' ? 'Untouched' : 'Not started'}
          </li>
        </ul>
        <p className="mt-3 text-[10px] italic text-slate-500">
          You → GOALS / TASKS hubs → items · purple = structure · color = status
        </p>
      </div>

      <GraphControlPanel
        mode={props.mode}
        settings={settings}
        onSettingsChange={patchSettings}
        onResetView={() => {
          transformRef.current = { ...DEFAULT_TRANSFORM[props.mode] }
        }}
        onFitView={() => {
          const nodes = physics.getNodes()
          const b = getTreeBounds(nodes)
          if (b.width > 0) {
            const k = props.mode === 'company' ? 0.4 : props.mode === 'team' ? 0.55 : 0.88
            const cx = (b.minX + b.maxX) / 2
            const cy = (b.minY + b.maxY) / 2
            transformRef.current = { x: -cx * k, y: -cy * k, k }
          } else {
            transformRef.current = { ...DEFAULT_TRANSFORM[props.mode] }
          }
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

      {props.mode === 'personal' && moonMeta && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 max-w-xs rounded-xl border border-cyan-500/30 bg-black/85 p-4 backdrop-blur-md sm:bottom-6 sm:right-6">
          <p className="text-sm font-medium text-cyan-100">{hovered?.label}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {moonMeta.kind === 'goal' && (
              <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">
                {moonMeta.goal.thrustArea}
              </span>
            )}
            <span className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400">
              {statusLabel(moonMeta.status)}
            </span>
          </div>
          <p className="mt-3 text-xs text-cyan-400/80">Click to open goals →</p>
        </div>
      )}

      {props.mode !== 'personal' && hoverEmployee && (
        <div className="pointer-events-none absolute bottom-4 right-4 z-10 max-w-sm rounded-xl border border-cyan-500/30 bg-black/90 p-4 backdrop-blur-md sm:bottom-6 sm:right-6">
          <p className="text-sm font-medium text-cyan-100">{hoverEmployee.name}</p>
          <p className="text-xs text-slate-400">
            {hoverEmployee.department} · {Math.round(computeWeightedScore(hoverEmployee.goals))}% overall
          </p>
          {hoverEmployee.goals.length > 0 && (
            <ul className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-slate-300">
              {hoverEmployee.goals.map((g) => (
                <li key={g.id} className="flex justify-between gap-2">
                  <span className="truncate">{g.title}</span>
                  <span className="shrink-0 text-slate-500">{g.approvalStatus}</span>
                </li>
              ))}
            </ul>
          )}
          {(() => {
            const tasks = buildEmployeeTasks(hoverEmployee).filter((t) => !t.done)
            if (tasks.length === 0) return null
            return (
              <div className="mt-3 border-t border-white/10 pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300">
                  Open tasks
                </p>
                <ul className="mt-1 space-y-1 text-xs text-slate-400">
                  {tasks.slice(0, 4).map((t) => (
                    <li key={t.id}>· {t.title}</li>
                  ))}
                </ul>
              </div>
            )
          })()}
          {meta?.kind === 'goal' && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="text-xs font-medium text-cyan-100">{meta.goal.title}</p>
              <p className="text-xs text-cyan-400/80">{statusLabel(meta.status)} · goal</p>
            </div>
          )}
          {meta?.kind === 'task' && (
            <div className="mt-2 border-t border-white/10 pt-2">
              <p className="text-xs font-medium text-cyan-100">{meta.task.title}</p>
              <p className="text-xs text-cyan-400/80">{statusLabel(meta.status)} · task</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}