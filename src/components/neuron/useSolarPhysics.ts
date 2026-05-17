import { useRef, useCallback } from 'react'
import type { GraphLayoutId } from '../../lib/neuronGraph'

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
  isLeaf?: boolean
  /** Set by layered tree layout — use fixed x,y (no physics). */
  layer?: number
  meta?: Record<string, unknown>
}

export interface SolarEdge {
  from: string
  to: string
  color: string
  curvature: number
  burst?: { angle: number; len: number }
}

export interface PhysicsOptions {
  layoutId: GraphLayoutId
  useTreeLayout?: boolean
  /** Polar coords measured from canvas center (circular layout). */
  polarFromCenter?: boolean
}

function nodeDepthOrder(nodes: SolarNode[]): SolarNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const depthOf = (n: SolarNode): number => {
    if (!n.parentId) return 0
    const p = byId.get(n.parentId)
    return p ? depthOf(p) + 1 : 0
  }
  return [...nodes].sort((a, b) => depthOf(a) - depthOf(b))
}

function isTreeLayout(nodes: SolarNode[]) {
  return nodes.some((n) => n.layer !== undefined)
}

/** Polar hub layout (personal radial only). */
function resolvePolarLayout(
  nodes: SolarNode[],
  cx = 0,
  cy = 0,
  skipId?: string | null,
  fromCenter = false,
) {
  for (const n of nodeDepthOrder(nodes)) {
    if (n.layer !== undefined) continue

    if (n.type === 'sun') {
      n.targetX = cx
      n.targetY = cy
      if (n.id !== skipId) {
        n.x = cx
        n.y = cy
      }
      continue
    }

    if (n.id === skipId) continue

    const parent = n.parentId ? nodes.find((p) => p.id === n.parentId) : null
    const ox = fromCenter ? cx : parent ? parent.x : cx
    const oy = fromCenter ? cy : parent ? parent.y : cy

    n.targetX = ox + Math.cos(n.baseAngle) * n.baseDistance
    n.targetY = oy + Math.sin(n.baseAngle) * n.baseDistance
    n.x = n.targetX
    n.y = n.targetY
  }
}

function snapTreeNodes(nodes: SolarNode[], skipId?: string | null) {
  for (const n of nodes) {
    if (n.layer === undefined) continue
    if (n.id === skipId) continue
    n.targetX = n.x
    n.targetY = n.y
  }
}

export function useSolarPhysics() {
  const nodesRef = useRef<SolarNode[]>([])
  const edgesRef = useRef<SolarEdge[]>([])
  const dragRef = useRef<{ id: string; ox: number; oy: number } | null>(null)
  const treeRef = useRef(false)
  const polarFromCenterRef = useRef(false)

  const init = useCallback((nodes: SolarNode[], edges: SolarEdge[], options?: PhysicsOptions) => {
    treeRef.current = options?.useTreeLayout ?? isTreeLayout(nodes)
    polarFromCenterRef.current = options?.polarFromCenter ?? false
    nodesRef.current = nodes.map((n) => ({ ...n, vx: 0, vy: 0 }))
    edgesRef.current = edges

    if (treeRef.current) {
      snapTreeNodes(nodesRef.current)
    } else {
      resolvePolarLayout(nodesRef.current, 0, 0, null, polarFromCenterRef.current)
    }
  }, [])

  const step = useCallback((cx: number, cy: number, _time: number) => {
    const nodes = nodesRef.current
    const skipId = dragRef.current?.id ?? null

    if (treeRef.current) {
      snapTreeNodes(nodes, skipId)
    } else {
      resolvePolarLayout(nodes, cx, cy, skipId, polarFromCenterRef.current)
    }

    return nodes
  }, [])

  const startDrag = useCallback((id: string, gx: number, gy: number) => {
    const n = nodesRef.current.find((x) => x.id === id)
    if (!n || n.fixed) return false
    dragRef.current = { id, ox: gx - n.x, oy: gy - n.y }
    return true
  }, [])

  const drag = useCallback((gx: number, gy: number) => {
    const d = dragRef.current
    if (!d) return
    const n = nodesRef.current.find((x) => x.id === d.id)
    if (!n) return
    n.x = gx - d.ox
    n.y = gy - d.oy
    n.targetX = n.x
    n.targetY = n.y
  }, [])

  const endDrag = useCallback(() => {
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
