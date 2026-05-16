import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Employee, Goal } from '../../types'
import { computeScore, scoreColor } from '../../lib/scoreEngine'
import {
  useForceGraphPhysics,
  type GraphNode,
  type GraphEdge,
} from './useForceGraphPhysics'

interface PersonalNeuronGraphProps {
  employee: Employee
  tasks: { id: string; title: string; done: boolean; goalId?: string }[]
  height?: number
}

function buildGraph(
  employee: Employee,
  tasks: PersonalNeuronGraphProps['tasks'],
  W: number,
  H: number,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const cx = W / 2
  const cy = H / 2
  const nodes: GraphNode[] = [
    {
      id: 'center',
      label: employee.initials,
      type: 'center',
      radius: 36,
      color: '#a855f7',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      fixed: true,
    },
    {
      id: 'hub-goals',
      label: 'Goals',
      type: 'hub',
      radius: 22,
      color: '#818cf8',
      x: cx - 120,
      y: cy - 80,
      vx: 0,
      vy: 0,
    },
    {
      id: 'hub-checkin',
      label: 'Check-in',
      type: 'hub',
      radius: 20,
      color: '#c084fc',
      x: cx + 130,
      y: cy - 60,
      vx: 0,
      vy: 0,
    },
    {
      id: 'hub-reports',
      label: 'Reports',
      type: 'hub',
      radius: 20,
      color: '#7c3aed',
      x: cx + 100,
      y: cy + 90,
      vx: 0,
      vy: 0,
    },
  ]

  const edges: GraphEdge[] = [
    { from: 'center', to: 'hub-goals' },
    { from: 'center', to: 'hub-checkin' },
    { from: 'center', to: 'hub-reports' },
  ]

  employee.goals.forEach((g, i) => {
    const angle = (i / Math.max(employee.goals.length, 1)) * Math.PI * 2
    const actual = g.quarterlyActuals.at(-1)?.actual ?? 0
    const pct = computeScore(g, actual)
    nodes.push({
      id: g.id,
      label: g.title.slice(0, 14),
      type: 'goal',
      radius: 16,
      color: scoreColor(pct),
      x: cx + Math.cos(angle) * 160,
      y: cy + Math.sin(angle) * 140,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      meta: { goal: g },
    })
    edges.push({ from: 'center', to: g.id })
    edges.push({ from: 'hub-goals', to: g.id })
  })

  tasks.forEach((t, i) => {
    const angle = Math.PI + (i / Math.max(tasks.length, 1)) * Math.PI
    nodes.push({
      id: t.id,
      label: t.title.slice(0, 12),
      type: 'task',
      radius: 12,
      color: t.done ? '#34d399' : '#fbbf24',
      x: cx + Math.cos(angle) * 200,
      y: cy + Math.sin(angle) * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      meta: { task: t },
    })
    edges.push({ from: 'center', to: t.id })
    if (t.goalId) edges.push({ from: t.goalId, to: t.id })
  })

  return { nodes, edges }
}

export default function PersonalNeuronGraph({
  employee,
  tasks,
  height = 420,
}: PersonalNeuronGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const physics = useForceGraphPhysics()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<GraphNode | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const initialized = useRef(false)
  const edgesStore = useRef<GraphEdge[]>([])

  const graphKey = useMemo(
    () => `${employee.id}-${employee.goals.length}-${tasks.length}`,
    [employee, tasks],
  )

  const hitTest = useCallback(
    (mx: number, my: number) => {
      const nodes = physics.getNodes()
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]
        if (Math.hypot(mx - n.x, my - n.y) < n.radius + 6) return n
      }
      return null
    },
    [physics],
  )

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = canvas.width / dpr
    const H = canvas.height / dpr

    physics.step(W, H)
    const nodes = physics.getNodes()

    ctx.clearRect(0, 0, W, H)

    for (const e of edgesStore.current) {
      const a = nodes.find((n) => n.id === e.from)
      const b = nodes.find((n) => n.id === e.to)
      if (!a || !b) continue
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.strokeStyle =
        hovered === a.id || hovered === b.id
          ? 'rgba(192, 132, 252, 0.55)'
          : 'rgba(168, 85, 247, 0.2)'
      ctx.lineWidth = hovered === a.id || hovered === b.id ? 2 : 1
      ctx.stroke()
    }

    const time = performance.now() / 1000
    for (const n of nodes) {
      const pulse = n.type === 'center' ? Math.sin(time * 1.4) * 0.5 + 0.5 : 0
      const isHover = hovered === n.id
      const isSel = selected?.id === n.id

      if (n.type === 'center' || isHover || isSel) {
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.radius + 4 + pulse * 5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(192, 132, 252, 0.4)'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)
      if (n.type === 'center') {
        ctx.fillStyle = '#7c3aed'
      } else {
        const g = ctx.createRadialGradient(
          n.x - 4,
          n.y - 4,
          0,
          n.x,
          n.y,
          n.radius,
        )
        g.addColorStop(0, n.color)
        g.addColorStop(1, n.color + '55')
        ctx.fillStyle = g
      }
      ctx.fill()
      ctx.strokeStyle = isSel
        ? '#e9d5ff'
        : isHover
          ? '#c084fc'
          : 'rgba(168, 85, 247, 0.5)'
      ctx.lineWidth = isSel ? 2.5 : 1.5
      ctx.stroke()

      ctx.fillStyle = '#f3f0ff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font =
        n.type === 'center'
          ? 'bold 13px DM Sans'
          : n.radius > 14
            ? '600 9px DM Sans'
            : '600 8px DM Sans'
      const text =
        n.label.length > 10 ? `${n.label.slice(0, 9)}…` : n.label
      ctx.fillText(text, n.x, n.y)
    }

    animRef.current = requestAnimationFrame(draw)
  }, [physics, hovered, selected])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
      }
      if (!initialized.current) {
        const { nodes, edges } = buildGraph(
          employee,
          tasks,
          rect.width,
          rect.height,
        )
        edgesStore.current = edges
        physics.init(nodes, edges)
        initialized.current = true
      }
    }

    resize()
    window.addEventListener('resize', resize)
    animRef.current = requestAnimationFrame(draw)
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [graphKey, employee, tasks, physics, draw])

  useEffect(() => {
    initialized.current = false
  }, [graphKey])

  const toLocal = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleNodeAction = (n: GraphNode) => {
    if (n.type === 'hub') {
      if (n.id === 'hub-goals') navigate('/my-goals')
      else if (n.id === 'hub-reports') navigate('/reports')
    }
    if (n.type === 'goal') setSelected(n)
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-purple bg-bg-card glow-purple-sm">
      <div className="border-b border-purple px-4 py-3">
        <h3 className="font-heading text-sm font-bold text-accent-glow">
          Your knowledge graph
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">
          Drag nodes · click goals & hubs · floating physics
        </p>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full cursor-grab active:cursor-grabbing"
        style={{ height }}
        onMouseMove={(e) => {
          const { x, y } = toLocal(e)
          const hit = hitTest(x, y)
          setHovered(hit?.id ?? null)
          if (e.buttons === 1) physics.drag(x, y)
        }}
        onMouseDown={(e) => {
          const { x, y } = toLocal(e)
          const hit = hitTest(x, y)
          if (hit && hit.type !== 'center') physics.startDrag(hit.id, x, y)
        }}
        onMouseUp={() => physics.endDrag()}
        onMouseLeave={() => {
          physics.endDrag()
          setHovered(null)
        }}
        onClick={(e) => {
          const { x, y } = toLocal(e)
          const hit = hitTest(x, y)
          if (hit) handleNodeAction(hit)
        }}
      />
      {selected?.type === 'goal' && (
        <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-purple-strong bg-bg-elevated/95 p-3 backdrop-blur">
          <p className="text-sm font-medium">
            {(selected.meta?.goal as Goal)?.title}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {(selected.meta?.goal as Goal)?.thrustArea} ·{' '}
            {(selected.meta?.goal as Goal)?.weightage}% weight
          </p>
          <button
            type="button"
            className="mt-2 text-xs text-accent-glow hover:underline"
            onClick={() => navigate('/my-goals')}
          >
            Open goal sheet →
          </button>
        </div>
      )}
    </div>
  )
}
