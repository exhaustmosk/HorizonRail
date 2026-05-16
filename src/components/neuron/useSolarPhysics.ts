import { useRef, useCallback } from 'react'

export type NodeType = 'sun' | 'planet' | 'moon'

export interface SolarNode {
  id: string
  type: NodeType
  label: string
  radius: number
  color: string
  baseDistance: number
  baseAngle: number
  parentId?: string
  x: number
  y: number
  vx: number
  vy: number
  targetX: number
  targetY: number
  depth: number
  fixed?: boolean
  meta?: Record<string, unknown>
}

export interface SolarEdge {
  from: string
  to: string
  color: string
  curvature: number
  burst?: { angle: number; len: number }
}

const SPRING_K = 0.065
const DAMPING = 0.82
const BOUNCE = 0.92

export function useSolarPhysics() {
  const nodesRef = useRef<SolarNode[]>([])
  const edgesRef = useRef<SolarEdge[]>([])
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)

  const init = useCallback((nodes: SolarNode[], edges: SolarEdge[]) => {
    nodesRef.current = nodes.map((n) => ({
      ...n,
      vx: n.vx ?? 0,
      vy: n.vy ?? 0,
      targetX: n.x,
      targetY: n.y,
    }))
    edgesRef.current = edges
  }, [])

  const computeTargets = useCallback((cx: number, cy: number, time: number) => {
    const nodes = nodesRef.current

    nodes.forEach((n) => {
      if (n.type === 'sun') {
        n.targetX = cx
        n.targetY = cy
        return
      }

      if (n.type === 'planet') {
        const orbitSpeed = 0.015
        const angle = n.baseAngle + time * orbitSpeed
        const distance = n.baseDistance + Math.sin(time * 0.4 + n.baseAngle) * 6
        n.targetX = cx + Math.cos(angle) * distance
        n.targetY = cy + Math.sin(angle) * distance
        n.depth = 0.55 + Math.sin(time * 0.3) * 0.08
        return
      }

      if (n.type === 'moon' && n.parentId) {
        const parent = nodes.find((p) => p.id === n.parentId)
        if (!parent) return
        const orbitSpeed = 0.12 + (n.baseAngle % 3) * 0.04
        const angle = n.baseAngle + time * orbitSpeed
        const wobble = Math.sin(time * 1.2 + n.baseAngle * 2) * 5
        const distance = n.baseDistance + wobble
        n.targetX = parent.x + Math.cos(angle) * distance
        n.targetY = parent.y + Math.sin(angle) * distance
        n.depth = 0.35 + 0.45 * ((Math.sin(angle) + 1) / 2)
      }
    })
  }, [])

  const step = useCallback((cx: number, cy: number, time: number) => {
    const nodes = nodesRef.current
    computeTargets(cx, cy, time)

    for (const n of nodes) {
      if (n.fixed) {
        n.x = n.targetX
        n.y = n.targetY
        n.vx = 0
        n.vy = 0
        continue
      }

      if (dragRef.current?.id === n.id) continue

      const dx = n.targetX - n.x
      const dy = n.targetY - n.y
      n.vx += dx * SPRING_K
      n.vy += dy * SPRING_K
      n.vx *= DAMPING
      n.vy *= DAMPING

      if (Math.hypot(dx, dy) < 2 && Math.hypot(n.vx, n.vy) < 0.5) {
        n.x = n.targetX
        n.y = n.targetY
        n.vx *= BOUNCE * 0.3
        n.vy *= BOUNCE * 0.3
      } else {
        n.x += n.vx
        n.y += n.vy
      }
    }

    return nodes
  }, [computeTargets])

  const startDrag = useCallback((id: string, gx: number, gy: number) => {
    const n = nodesRef.current.find((x) => x.id === id)
    if (!n || n.fixed) return false
    dragRef.current = { id, ox: gx - n.x, oy: gy - n.y }
    n.vx = 0
    n.vy = 0
    return true
  }, [])

  const drag = useCallback((gx: number, gy: number) => {
    const d = dragRef.current
    if (!d) return
    const n = nodesRef.current.find((x) => x.id === d.id)
    if (n) {
      const prevX = n.x
      const prevY = n.y
      n.x = gx - d.ox
      n.y = gy - d.oy
      n.vx = (n.x - prevX) * 0.6
      n.vy = (n.y - prevY) * 0.6
    }
  }, [])

  const endDrag = useCallback(() => {
    const d = dragRef.current
    if (d) {
      const n = nodesRef.current.find((x) => x.id === d.id)
      if (n) {
        n.vx *= 1.4
        n.vy *= 1.4
      }
    }
    dragRef.current = null
  }, [])

  const isDragging = useCallback(() => dragRef.current !== null, [])

  const getNodes = useCallback(() => nodesRef.current, [])
  const getEdges = useCallback(() => edgesRef.current, [])

  return {
    init,
    step,
    startDrag,
    drag,
    endDrag,
    isDragging,
    getNodes,
    getEdges,
  }
}
