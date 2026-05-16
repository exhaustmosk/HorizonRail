import { useRef, useCallback } from 'react'

export interface GraphNode {
  id: string
  label: string
  type: 'center' | 'goal' | 'task' | 'hub'
  radius: number
  color: string
  x: number
  y: number
  vx: number
  vy: number
  fixed?: boolean
  meta?: Record<string, unknown>
}

export interface GraphEdge {
  from: string
  to: string
}

interface PhysicsConfig {
  repulsion: number
  springLength: number
  springK: number
  damping: number
  drift: number
  centerPull: number
}

const DEFAULT: PhysicsConfig = {
  repulsion: 4200,
  springLength: 110,
  springK: 0.04,
  damping: 0.88,
  drift: 0.018,
  centerPull: 0.002,
}

export function useForceGraphPhysics(config: Partial<PhysicsConfig> = {}) {
  const cfg = { ...DEFAULT, ...config }
  const nodesRef = useRef<GraphNode[]>([])
  const edgesRef = useRef<GraphEdge[]>([])
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)

  const init = useCallback((nodes: GraphNode[], edges: GraphEdge[]) => {
    nodesRef.current = nodes.map((n) => ({ ...n }))
    edgesRef.current = edges
  }, [])

  const step = useCallback((W: number, H: number, dt = 1) => {
    const nodes = nodesRef.current
    const edges = edgesRef.current
    const cx = W / 2
    const cy = H / 2

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i]
      if (a.fixed || dragRef.current?.id === a.id) continue

      let fx = 0
      let fy = 0

      fx += (cx - a.x) * cfg.centerPull
      fy += (cy - a.y) * cfg.centerPull

      fx += (Math.random() - 0.5) * cfg.drift * 60
      fy += (Math.random() - 0.5) * cfg.drift * 60

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.max(Math.hypot(dx, dy), 1)
        const minDist = a.radius + b.radius + 12
        const force = cfg.repulsion / (dist * dist)
        const overlap = minDist - dist
        const push = overlap > 0 ? overlap * 0.8 + force : force
        const nx = dx / dist
        const ny = dy / dist
        if (!a.fixed && dragRef.current?.id !== a.id) {
          fx += nx * push
          fy += ny * push
        }
        if (!b.fixed && dragRef.current?.id !== b.id) {
          b.vx -= nx * push * 0.5
          b.vy -= ny * push * 0.5
        }
      }

      for (const e of edges) {
        const other =
          e.from === a.id
            ? nodes.find((n) => n.id === e.to)
            : e.to === a.id
              ? nodes.find((n) => n.id === e.from)
              : null
        if (!other) continue
        const dx = other.x - a.x
        const dy = other.y - a.y
        const dist = Math.hypot(dx, dy) || 1
        const stretch = dist - cfg.springLength
        fx += (dx / dist) * stretch * cfg.springK
        fy += (dy / dist) * stretch * cfg.springK
      }

      a.vx = (a.vx + fx * dt) * cfg.damping
      a.vy = (a.vy + fy * dt) * cfg.damping
      a.x += a.vx * dt
      a.y += a.vy * dt

      const pad = a.radius + 8
      a.x = Math.max(pad, Math.min(W - pad, a.x))
      a.y = Math.max(pad, Math.min(H - pad, a.y))
    }

    return nodes
  }, [cfg])

  const startDrag = (id: string, mx: number, my: number) => {
    const n = nodesRef.current.find((x) => x.id === id)
    if (!n) return
    dragRef.current = { id, ox: mx - n.x, oy: my - n.y }
    n.vx = 0
    n.vy = 0
  }

  const drag = (mx: number, my: number) => {
    const d = dragRef.current
    if (!d) return
    const n = nodesRef.current.find((x) => x.id === d.id)
    if (n) {
      n.x = mx - d.ox
      n.y = my - d.oy
    }
  }

  const endDrag = () => {
    dragRef.current = null
  }

  const getNodes = () => nodesRef.current

  return {
    init,
    step,
    startDrag,
    drag,
    endDrag,
    getNodes,
    nodesRef,
    edgesRef,
  }
}
