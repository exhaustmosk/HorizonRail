import type { Employee } from '../types'
import { STATUS_COLORS, getGoalMoonStatus } from './graphStatus'
import type { MoonStatus } from './graphStatus'
import type { SolarNode, SolarEdge } from '../components/neuron/useSolarPhysics'

export type GraphLayoutId = 'solar' | 'compact' | 'radial' | 'spiral' | 'wide'

export interface GraphBuildOptions {
  showBurst: boolean
  showSunLinks: boolean
  burstCount: number
}

export const LAYOUT_LABELS: Record<GraphLayoutId, string> = {
  solar: 'Solar system',
  compact: 'Compact cluster',
  radial: 'Radial ring',
  spiral: 'Spiral arms',
  wide: 'Wide spread',
}

const EDGE_COLORS: Record<MoonStatus, string> = {
  complete: '#22d3ee',
  partial: '#fb923c',
  error: '#f472b6',
  untouched: '#67e8f9',
}

function moonLayout(
  layout: GraphLayoutId,
  i: number,
  count: number,
): { angle: number; dist: number } {
  const t = count > 1 ? i / count : 0
  const baseAngle = t * Math.PI * 2

  switch (layout) {
    case 'compact':
      return { angle: baseAngle + 0.1, dist: 48 + (i % 2) * 14 }
    case 'radial':
      return { angle: baseAngle, dist: 78 }
    case 'spiral':
      return { angle: baseAngle + i * 0.35, dist: 55 + i * 14 }
    case 'wide':
      return { angle: baseAngle + (i % 2 ? 0.2 : -0.2), dist: 95 + (i % 4) * 22 }
    default:
      return {
        angle: baseAngle + (i % 2 === 0 ? -0.15 : 0.15),
        dist: 72 + (i % 3) * 28 + (i % 2) * 12,
      }
  }
}

function planetConfig(layout: GraphLayoutId) {
  switch (layout) {
    case 'compact':
      return { baseDistance: 95, baseAngle: -0.3 }
    case 'radial':
      return { baseDistance: 140, baseAngle: 0 }
    case 'spiral':
      return { baseDistance: 120, baseAngle: 0.5 }
    case 'wide':
      return { baseDistance: 240, baseAngle: -0.5 }
    default:
      return { baseDistance: 160, baseAngle: -0.4 }
  }
}

export function buildGraphData(
  employee: Employee,
  layout: GraphLayoutId,
  options: GraphBuildOptions,
): { nodes: SolarNode[]; edges: SolarEdge[] } {
  const nodes: SolarNode[] = []
  const edges: SolarEdge[] = []
  const planet = planetConfig(layout)

  nodes.push({
    id: 'sun',
    type: 'sun',
    label: employee.name,
    radius: 36,
    color: '#a78bfa',
    baseDistance: 0,
    baseAngle: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    depth: 0.7,
    fixed: true,
  })

  nodes.push({
    id: 'planet-goals',
    type: 'planet',
    label: 'GOALS',
    radius: 22,
    color: '#818cf8',
    baseDistance: planet.baseDistance,
    baseAngle: planet.baseAngle,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    targetX: 0,
    targetY: 0,
    depth: 0.6,
    parentId: 'sun',
  })

  edges.push({ from: 'sun', to: 'planet-goals', color: '#67e8f9', curvature: 0.35 })

  const goalCount = employee.goals.length
  employee.goals.forEach((g, i) => {
    const status = getGoalMoonStatus(g)
    const { angle, dist } = moonLayout(layout, i, goalCount)

    nodes.push({
      id: g.id,
      type: 'moon',
      label: g.title,
      radius: 9,
      color: STATUS_COLORS[status],
      baseDistance: dist,
      baseAngle: angle,
      parentId: 'planet-goals',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      depth: 0.4 + (i % 5) * 0.1,
      meta: { goal: g, status },
    })

    edges.push({
      from: 'planet-goals',
      to: g.id,
      color: EDGE_COLORS[status],
      curvature: (i % 2 === 0 ? 1 : -1) * (0.25 + (i % 4) * 0.08),
    })

    if (options.showSunLinks) {
      edges.push({
        from: 'sun',
        to: g.id,
        color: 'rgba(103, 232, 249, 0.18)',
        curvature: ((i % 3) - 1) * 0.5,
      })
    }
  })

  if (options.showBurst) {
    for (let i = 0; i < options.burstCount; i++) {
      const angle = (i / options.burstCount) * Math.PI * 2 + 0.2
      edges.push({
        from: 'planet-goals',
        to: `burst-${i}`,
        color:
          i % 3 === 0
            ? 'rgba(251, 146, 60, 0.14)'
            : i % 3 === 1
              ? 'rgba(244, 114, 182, 0.12)'
              : 'rgba(103, 232, 249, 0.12)',
        curvature: (i % 2 === 0 ? 1 : -1) * 0.35,
        burst: { angle, len: 130 + (i % 4) * 18 },
      })
    }
  }

  return { nodes, edges }
}

export interface GraphExportPayload {
  version: 1
  employeeId: string
  layout: GraphLayoutId
  settings: GraphBuildOptions & { labelsAlways: boolean; animationPaused: boolean }
  transform: { x: number; y: number; k: number }
  nodes: Array<{
    id: string
    x: number
    y: number
    baseDistance: number
    baseAngle: number
  }>
  exportedAt: string
}
