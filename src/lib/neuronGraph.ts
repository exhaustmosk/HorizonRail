import type { Employee, Goal } from '../types'
import type { EmployeeTask } from './employeeTasks'
import { buildEmployeeTasks } from './employeeTasks'
import {
  STATUS_COLORS,
  getGoalMoonStatus,
  getTaskMoonStatus,
} from './graphStatus'
import type { MoonStatus } from './graphStatus'
import type { SolarEdge, SolarNode } from '../components/neuron/useSolarPhysics'
import { applyCircularLayout } from './graphClusterLayout'
import { applyLayeredTreeLayout } from './layeredTreeLayout'

export type GraphLayoutId = 'default' | 'circular'
export type GraphSpacingId = 'compact' | 'normal' | 'roomy' | 'spacious'
export type NeuronGraphMode = 'personal' | 'team' | 'company'

export interface GraphBuildOptions {
  showBurst: boolean
  showSunLinks: boolean
  burstCount: number
}

export const LAYOUT_LABELS: Record<GraphLayoutId, string> = {
  default: 'Hub & spoke',
  circular: 'Circular',
}

export const SPACING_LABELS: Record<GraphSpacingId, string> = {
  compact: 'Compact',
  normal: 'Normal',
  roomy: 'Roomy',
  spacious: 'Spacious',
}

export function spacingScale(spacing: GraphSpacingId): number {
  switch (spacing) {
    case 'compact':
      return 0.82
    case 'roomy':
      return 1.18
    case 'spacious':
      return 1.38
    default:
      return 1
  }
}

/** Map legacy saved layout ids to the current set. */
export function normalizeLayoutId(raw: string | undefined): GraphLayoutId {
  return raw === 'circular' ? 'circular' : 'default'
}

export function normalizeSpacingId(raw: string | undefined): GraphSpacingId {
  if (raw === 'compact' || raw === 'roomy' || raw === 'spacious') return raw
  return 'normal'
}

/** Purple palette — hub / person nodes only (never on leaves). */
export const HUB_COLORS = {
  sun: '#c4b5fd',
  planet: '#a78bfa',
  person: '#8b5cf6',
  category: '#7c3aed',
} as const

const HUB_EDGE = 'rgba(167, 139, 250, 0.38)'

const EDGE_BY_STATUS = {
  complete: '#22c55e',
  partial: '#eab308',
  error: '#ef4444',
  untouched: '#94a3b8',
} as const

export type NodeMeta =
  | { kind: 'goal'; goal: Goal; status: MoonStatus; employee?: Employee }
  | { kind: 'task'; task: EmployeeTask; status: MoonStatus; employee: Employee }
  | { kind: 'manager'; employee: Employee }
  | { kind: 'employee'; employee: Employee; manager?: Employee }
  | { kind: 'company'; label: string }
  | { kind: 'hub'; hub: 'goals' | 'tasks' }

export interface NeuronGraphConfig {
  mode: NeuronGraphMode
  layout: GraphLayoutId
  spacing: GraphSpacingId
  options: GraphBuildOptions
  employee?: Employee
  manager?: Employee
  reports?: Employee[]
  employees?: Employee[]
  companyName?: string
}

export interface GraphExportPayload {
  version: 2
  mode: NeuronGraphMode
  graphId: string
  layout: GraphLayoutId
  spacing?: GraphSpacingId
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

function scale(spacing: GraphSpacingId, n: number) {
  return n * spacingScale(spacing)
}

function baseNode(
  partial: Omit<SolarNode, 'x' | 'y' | 'vx' | 'vy' | 'targetX' | 'targetY'>,
): SolarNode {
  return { ...partial, x: 0, y: 0, vx: 0, vy: 0, targetX: 0, targetY: 0 }
}

function hubEdge(from: string, to: string): SolarEdge {
  return { from, to, color: HUB_EDGE, curvature: 0 }
}

function leafEdge(from: string, to: string, status: MoonStatus): SolarEdge {
  return { from, to, color: EDGE_BY_STATUS[status], curvature: 0 }
}

type LeafItem = {
  id: string
  label: string
  radius: number
  status: MoonStatus
  meta: NodeMeta
}

function addLeafBurst(
  nodes: SolarNode[],
  edges: SolarEdge[],
  parentId: string,
  items: LeafItem[],
  hubAngle: number,
  leafDist: number,
) {
  const count = items.length
  if (count === 0) return
  const arc = Math.min(Math.PI * 1.15, count * 0.36)
  items.forEach((item, i) => {
    const angle =
      count === 1 ? hubAngle : hubAngle - arc / 2 + (i / (count - 1)) * arc
    nodes.push(
      baseNode({
        id: item.id,
        type: 'moon',
        label: item.label,
        radius: item.radius,
        color: STATUS_COLORS[item.status],
        baseDistance: leafDist,
        baseAngle: angle,
        parentId,
        depth: 0.28,
        meta: item.meta,
        isLeaf: true,
      }),
    )
    edges.push(leafEdge(parentId, item.id, item.status))
  })
}

function goalLeaves(emp: Employee): LeafItem[] {
  return emp.goals.map((g) => {
    const status = getGoalMoonStatus(g)
    return {
      id: `goal-${g.id}`,
      label: g.title,
      radius: 6,
      status,
      meta: { kind: 'goal' as const, goal: g, status, employee: emp },
    }
  })
}

function taskLeaves(emp: Employee): LeafItem[] {
  return buildEmployeeTasks(emp)
    .filter((t) => !t.done)
    .map((t) => {
      const status = getTaskMoonStatus(t.done, t.priority)
      return {
        id: `task-${t.id}`,
        label: t.title,
        radius: 5,
        status,
        meta: { kind: 'task' as const, task: t, status, employee: emp },
      }
    })
}

/** Person → GOALS hub → goal leaves, Person → TASKS hub → task leaves */
function attachGoalAndTaskHubs(
  nodes: SolarNode[],
  edges: SolarEdge[],
  parentId: string,
  emp: Employee,
  spacing: GraphSpacingId,
  facingAngle: number,
  categoryType: 'planet' | 'moon' = 'planet',
) {
  const goals = goalLeaves(emp)
  const tasks = taskLeaves(emp)
  const catDist = scale(spacing, categoryType === 'planet' ? 105 : 52)
  const leafDist = scale(spacing, 42)

  if (goals.length > 0) {
    const hubId = `goals-hub-${emp.id}`
    nodes.push(
      baseNode({
        id: hubId,
        type: categoryType,
        label: 'GOALS',
        radius: categoryType === 'planet' ? 16 : 12,
        color: HUB_COLORS.category,
        baseDistance: catDist,
        baseAngle: facingAngle - 0.45,
        parentId,
        depth: categoryType === 'planet' ? 0.55 : 0.42,
        meta: { kind: 'hub', hub: 'goals' },
      }),
    )
    edges.push(hubEdge(parentId, hubId))
    addLeafBurst(nodes, edges, hubId, goals, facingAngle - 0.45, leafDist)
  }

  if (tasks.length > 0) {
    const hubId = `tasks-hub-${emp.id}`
    nodes.push(
      baseNode({
        id: hubId,
        type: categoryType,
        label: 'TASKS',
        radius: categoryType === 'planet' ? 14 : 11,
        color: HUB_COLORS.category,
        baseDistance: catDist,
        baseAngle: facingAngle + 0.45,
        parentId,
        depth: categoryType === 'planet' ? 0.52 : 0.4,
        meta: { kind: 'hub', hub: 'tasks' },
      }),
    )
    edges.push(hubEdge(parentId, hubId))
    addLeafBurst(nodes, edges, hubId, tasks, facingAngle + 0.45, leafDist * 0.92)
  }
}

function buildPersonalGraph(
  employee: Employee,
  spacing: GraphSpacingId,
): { nodes: SolarNode[]; edges: SolarEdge[] } {
  const nodes: SolarNode[] = []
  const edges: SolarEdge[] = []

  nodes.push(
    baseNode({
      id: 'sun',
      type: 'sun',
      label: employee.name,
      radius: 28,
      color: HUB_COLORS.sun,
      baseDistance: 0,
      baseAngle: 0,
      depth: 0.9,
      fixed: true,
      meta: { kind: 'manager', employee },
    }),
  )

  attachGoalAndTaskHubs(nodes, edges, 'sun', employee, spacing, -Math.PI / 2, 'planet')

  return { nodes, edges }
}

function buildTeamGraph(
  manager: Employee,
  reports: Employee[],
  spacing: GraphSpacingId,
): { nodes: SolarNode[]; edges: SolarEdge[] } {
  const nodes: SolarNode[] = []
  const edges: SolarEdge[] = []
  const count = Math.max(reports.length, 1)

  nodes.push(
    baseNode({
      id: 'sun',
      type: 'sun',
      label: manager.name,
      radius: 26,
      color: HUB_COLORS.sun,
      baseDistance: 0,
      baseAngle: 0,
      depth: 0.9,
      fixed: true,
      meta: { kind: 'manager', employee: manager },
    }),
  )

  reports.forEach((emp, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2
    const planetId = `emp-${emp.id}`

    nodes.push(
      baseNode({
        id: planetId,
        type: 'planet',
        label: emp.name.split(' ')[0],
        radius: 16,
        color: HUB_COLORS.person,
        baseDistance: scale(spacing, 185),
        baseAngle: angle,
        parentId: 'sun',
        depth: 0.68,
        meta: { kind: 'employee', employee: emp },
      }),
    )
    edges.push(hubEdge('sun', planetId))
    attachGoalAndTaskHubs(nodes, edges, planetId, emp, spacing, angle, 'moon')
  })

  return { nodes, edges }
}

function buildCompanyGraph(
  employees: Employee[],
  companyName: string,
  spacing: GraphSpacingId,
): { nodes: SolarNode[]; edges: SolarEdge[] } {
  const nodes: SolarNode[] = []
  const edges: SolarEdge[] = []
  const managers = employees.filter((e) => e.role === 'manager')
  const mCount = Math.max(managers.length, 1)

  nodes.push(
    baseNode({
      id: 'sun',
      type: 'sun',
      label: companyName.slice(0, 12),
      radius: 24,
      color: HUB_COLORS.sun,
      baseDistance: 0,
      baseAngle: 0,
      depth: 0.95,
      fixed: true,
      meta: { kind: 'company', label: companyName },
    }),
  )

  managers.forEach((mgr, mi) => {
    const sector = (mi / mCount) * Math.PI * 2 - Math.PI / 2
    const planetId = `mgr-${mgr.id}`
    const reports = employees.filter(
      (e) => e.managerId === mgr.id && e.role === 'employee',
    )

    nodes.push(
      baseNode({
        id: planetId,
        type: 'planet',
        label: mgr.name.split(' ')[0],
        radius: 18,
        color: HUB_COLORS.planet,
        baseDistance: scale(spacing, 360),
        baseAngle: sector,
        parentId: 'sun',
        depth: 0.78,
        meta: { kind: 'manager', employee: mgr },
      }),
    )
    edges.push(hubEdge('sun', planetId))

    const rCount = Math.max(reports.length, 1)
    const spread = Math.min(Math.PI * 0.5, Math.max(0.4, reports.length * 0.2))

    reports.forEach((emp, ri) => {
      const angle =
        rCount === 1
          ? sector
          : sector - spread / 2 + (ri / (rCount - 1)) * spread
      const empNodeId = `emp-${emp.id}`

      nodes.push(
        baseNode({
          id: empNodeId,
          type: 'moon',
          label: emp.name.split(' ')[0],
          radius: 11,
          color: HUB_COLORS.person,
          baseDistance: scale(spacing, 88),
          baseAngle: angle,
          parentId: planetId,
          depth: 0.58,
          meta: { kind: 'employee', employee: emp, manager: mgr },
        }),
      )
      edges.push(hubEdge(planetId, empNodeId))
      attachGoalAndTaskHubs(nodes, edges, empNodeId, emp, spacing, angle, 'moon')
    })
  })

  return { nodes, edges }
}

export function buildNeuronGraph(config: NeuronGraphConfig): {
  nodes: SolarNode[]
  edges: SolarEdge[]
} {
  const { mode, layout, spacing } = config
  const s = spacingScale(spacing)
  let result: { nodes: SolarNode[]; edges: SolarEdge[] }

  switch (mode) {
    case 'personal':
      if (!config.employee) return { nodes: [], edges: [] }
      result = buildPersonalGraph(config.employee, spacing)
      break
    case 'team':
      if (!config.manager) return { nodes: [], edges: [] }
      result = buildTeamGraph(config.manager, config.reports ?? [], spacing)
      break
    case 'company':
      result = buildCompanyGraph(
        config.employees ?? [],
        config.companyName ?? 'Company',
        spacing,
      )
      break
    default:
      return { nodes: [], edges: [] }
  }

  if (layout === 'default') {
    applyLayeredTreeLayout(
      result.nodes,
      mode,
      config.employees ?? [],
      config.manager,
      config.reports,
      config.employee,
      spacing,
    )
  } else {
    applyCircularLayout(result.nodes, mode, s)
  }

  return result
}

export function getGraphStorageId(config: NeuronGraphConfig): string {
  switch (config.mode) {
    case 'personal':
      return `personal-${config.employee?.id ?? 'unknown'}`
    case 'team':
      return `team-${config.manager?.id ?? 'unknown'}`
    case 'company':
      return 'company'
    default:
      return 'graph'
  }
}
