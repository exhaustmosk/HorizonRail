import type { SolarNode } from '../components/neuron/useSolarPhysics'
import { buildEmployeeTasks } from './employeeTasks'
import type { Employee } from '../types'
import type { GraphSpacingId, NeuronGraphMode } from './neuronGraph'
import { spacingScale } from './neuronGraph'

/** Horizontal layer X offsets (left → right). */
const LAYER_X = {
  root: 0,
  manager: 200,
  employee: 400,
  category: 560,
  leaf: 720,
} as const

const BRANCH_PAD = 44
const MGR_BLOCK_PAD = 56
const LEAF_ROW = 26
const MIN_BRANCH = 72

function branchHeight(emp: Employee): number {
  const goals = emp.goals.length
  const tasks = buildEmployeeTasks(emp).filter((t) => !t.done).length
  let h = MIN_BRANCH
  if (goals > 0) h = Math.max(h, HUB_BLOCK(goals))
  if (tasks > 0) h = Math.max(h, HUB_BLOCK(tasks))
  return h + BRANCH_PAD
}

function HUB_BLOCK(leafCount: number) {
  return 36 + leafCount * LEAF_ROW
}

function placeNode(n: SolarNode, x: number, y: number, layer: number) {
  n.layer = layer
  n.x = x
  n.y = y
  n.targetX = x
  n.targetY = y
  n.baseDistance = 0
  n.baseAngle = 0
}

function placeEmployeeSubtree(
  nodes: SolarNode[],
  emp: Employee,
  empNodeId: string,
  x: number,
  yCenter: number,
  lx = scaledLayer(1),
) {
  const empNode = nodes.find((n) => n.id === empNodeId)
  if (!empNode) return

  placeNode(empNode, x, yCenter, 2)

  const goals = emp.goals
  const tasks = buildEmployeeTasks(emp).filter((t) => !t.done)
  const goalsHubId = `goals-hub-${emp.id}`
  const tasksHubId = `tasks-hub-${emp.id}`
  const goalsHub = nodes.find((n) => n.id === goalsHubId)
  const tasksHub = nodes.find((n) => n.id === tasksHubId)

  const hasGoals = goals.length > 0 && goalsHub
  const hasTasks = tasks.length > 0 && tasksHub

  if (hasGoals && hasTasks) {
    const goalsBlock = HUB_BLOCK(goals.length)
    const tasksBlock = HUB_BLOCK(tasks.length)
    const total = goalsBlock + tasksBlock + 16
    const top = yCenter - total / 2

    placeNode(goalsHub, lx.category, top + goalsBlock / 2, 3)
    placeLeaves(
      nodes.filter((n) => n.parentId === goalsHubId && n.isLeaf),
      lx.leaf,
      top,
      goals.length,
      lx.leaf / LAYER_X.leaf,
    )

    const tasksTop = top + goalsBlock + 16 * (lx.leaf / LAYER_X.leaf)
    placeNode(tasksHub, lx.category, tasksTop + tasksBlock / 2, 3)
    placeLeaves(
      nodes.filter((n) => n.parentId === tasksHubId && n.isLeaf),
      lx.leaf,
      tasksTop,
      tasks.length,
      lx.leaf / LAYER_X.leaf,
    )
  } else if (hasGoals && goalsHub) {
    placeNode(goalsHub, lx.category, yCenter, 3)
    placeLeaves(
      nodes.filter((n) => n.parentId === goalsHubId && n.isLeaf),
      lx.leaf,
      yCenter - (goals.length * LEAF_ROW * (lx.leaf / LAYER_X.leaf)) / 2,
      goals.length,
      lx.leaf / LAYER_X.leaf,
    )
  } else if (hasTasks && tasksHub) {
    placeNode(tasksHub, lx.category, yCenter, 3)
    placeLeaves(
      nodes.filter((n) => n.parentId === tasksHubId && n.isLeaf),
      lx.leaf,
      yCenter - (tasks.length * LEAF_ROW * (lx.leaf / LAYER_X.leaf)) / 2,
      tasks.length,
      lx.leaf / LAYER_X.leaf,
    )
  }
}

function placeLeaves(
  leaves: SolarNode[],
  x: number,
  yStart: number,
  count: number,
  s = 1,
) {
  const row = LEAF_ROW * s
  const startY = yStart
  leaves.forEach((leaf, i) => {
    const y = count === 1 ? yStart : startY + i * row
    placeNode(leaf, x, y, 4)
  })
}

function scaledLayer(s: number) {
  return {
    root: LAYER_X.root,
    manager: LAYER_X.manager * s,
    employee: LAYER_X.employee * s,
    category: LAYER_X.category * s,
    leaf: LAYER_X.leaf * s,
  }
}

/** Company: Acme → managers → employees → GOALS/TASKS → items */
export function layoutCompanyTree(
  nodes: SolarNode[],
  employees: Employee[],
  s = 1,
) {
  const lx = scaledLayer(s)
  const branchPad = BRANCH_PAD * s
  const mgrBlockPad = MGR_BLOCK_PAD * s
  const sun = nodes.find((n) => n.id === 'sun')
  if (!sun) return

  const managers = employees.filter((e) => e.role === 'manager')
  const managerBlocks: { mgr: Employee; height: number; reports: Employee[] }[] =
    managers.map((mgr) => {
      const reports = employees.filter(
        (e) => e.managerId === mgr.id && e.role === 'employee',
      )
      const height =
        reports.reduce((s, emp) => s + branchHeight(emp), 0) +
        Math.max(0, reports.length - 1) * BRANCH_PAD
      return { mgr, height: Math.max(height, MIN_BRANCH), reports }
    })

  const totalHeight =
    managerBlocks.reduce((s, b) => s + b.height, 0) +
    Math.max(0, managerBlocks.length - 1) * MGR_BLOCK_PAD

  placeNode(sun, lx.root, 0, 0)

  let yCursor = -totalHeight / 2

  for (const block of managerBlocks) {
    const blockCenter = yCursor + block.height / 2
    const planetId = `mgr-${block.mgr.id}`
    const mgrNode = nodes.find((n) => n.id === planetId)
    if (mgrNode) placeNode(mgrNode, lx.manager, blockCenter, 1)

    let empY = yCursor
    for (const emp of block.reports) {
      const h = branchHeight(emp)
      const empCenter = empY + h / 2
      placeEmployeeSubtree(nodes, emp, `emp-${emp.id}`, lx.employee, empCenter, lx)
      empY += h
    }

    yCursor += block.height + mgrBlockPad
  }
}

/** Team: manager → members → GOALS/TASKS → items */
export function layoutTeamTree(
  nodes: SolarNode[],
  reports: Employee[],
  s = 1,
) {
  const lx = scaledLayer(s)
  const branchPad = BRANCH_PAD * s
  const sun = nodes.find((n) => n.id === 'sun')
  if (!sun) return

  const heights = reports.map((e) => branchHeight(e))
  const total =
    heights.reduce((a, b) => a + b, 0) + Math.max(0, reports.length - 1) * BRANCH_PAD

  placeNode(sun, lx.root, 0, 0)

  let y = -total / 2
  reports.forEach((emp, i) => {
    const h = heights[i]
    const center = y + h / 2
    const planetId = `emp-${emp.id}`
    const member = nodes.find((n) => n.id === planetId)
    if (member) placeNode(member, lx.manager, center, 1)
    placeEmployeeSubtree(nodes, emp, planetId, lx.employee, center, lx)
    y += h + branchPad
  })
}

/** Personal: you → GOALS/TASKS columns */
export function layoutPersonalTree(
  nodes: SolarNode[],
  employee: Employee,
  s = 1,
) {
  const hubX = 180 * s
  const leafX = 320 * s
  const sun = nodes.find((n) => n.id === 'sun')
  if (!sun) return

  placeNode(sun, 0, 0, 0)

  const goalsHub = nodes.find((n) => n.id === `goals-hub-${employee.id}`)
  const tasksHub = nodes.find((n) => n.id === `tasks-hub-${employee.id}`)
  const goals = employee.goals
  const tasks = buildEmployeeTasks(employee).filter((t) => !t.done)

  if (goalsHub && goals.length > 0) {
    const gh = HUB_BLOCK(goals.length) * s
    placeNode(goalsHub, hubX, -gh / 2 - 20 * s, 1)
    placeLeaves(
      nodes.filter((n) => n.parentId === goalsHub.id && n.isLeaf),
      leafX,
      -gh / 2 - 20 * s,
      goals.length,
      s,
    )
  }

  if (tasksHub && tasks.length > 0) {
    const th = HUB_BLOCK(tasks.length) * s
    placeNode(tasksHub, hubX, th / 2 + 20 * s, 1)
    placeLeaves(
      nodes.filter((n) => n.parentId === tasksHub.id && n.isLeaf),
      leafX,
      th / 2 + 20 * s - th / 2,
      tasks.length,
      s,
    )
  }
}

export function applyLayeredTreeLayout(
  nodes: SolarNode[],
  mode: NeuronGraphMode,
  employees: Employee[],
  manager?: Employee,
  reports?: Employee[],
  employee?: Employee,
  spacing: GraphSpacingId = 'normal',
) {
  const s = spacingScale(spacing)
  if (mode === 'company') {
    layoutCompanyTree(nodes, employees, s)
    return true
  }
  if (mode === 'team' && manager && reports) {
    layoutTeamTree(nodes, reports, s)
    return true
  }
  if (mode === 'personal' && employee) {
    layoutPersonalTree(nodes, employee, s)
    return true
  }
  return false
}

export function getTreeBounds(nodes: SolarNode[]) {
  let minX = 0
  let maxX = 0
  let minY = 0
  let maxY = 0
  for (const n of nodes) {
    if (n.layer === undefined) continue
    const pad = (n.isLeaf ? 8 : n.radius) + 20
    minX = Math.min(minX, n.x - pad)
    maxX = Math.max(maxX, n.x + pad)
    minY = Math.min(minY, n.y - pad)
    maxY = Math.max(maxY, n.y + pad)
  }
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}
