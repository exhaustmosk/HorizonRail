import type { SolarNode } from '../components/neuron/useSolarPhysics'
import type { NodeMeta } from './neuronGraph'
import type { NeuronGraphMode } from './neuronGraph'

/** Place nodes on rings around the origin (angles/distances from center). */
export function applyCircularLayout(
  nodes: SolarNode[],
  mode: NeuronGraphMode,
  scale: number,
) {
  if (mode === 'company') layoutCompanyCircular(nodes, scale)
  else if (mode === 'team') layoutTeamCircular(nodes, scale)
  else layoutPersonalCircular(nodes, scale)
}

function layoutPersonalCircular(nodes: SolarNode[], s: number) {
  const hubRing = 108 * s
  const leafRing = 188 * s

  for (const n of nodes) {
    const meta = n.meta as NodeMeta | undefined
    if (meta?.kind !== 'hub') continue
    const isGoals = meta.hub === 'goals'
    const hubAngle = isGoals ? -Math.PI / 2 : Math.PI / 2
    n.baseAngle = hubAngle
    n.baseDistance = hubRing
    ringLeaves(
      nodes.filter((c) => c.parentId === n.id && c.isLeaf),
      hubAngle,
      isGoals ? -Math.PI : 0,
      isGoals ? 0 : Math.PI,
      leafRing,
    )
  }
}

function layoutTeamCircular(nodes: SolarNode[], s: number) {
  const members = nodes.filter((n) => n.parentId === 'sun' && n.type === 'planet')
  const count = members.length
  const memberRing = (count <= 3 ? 175 : count <= 6 ? 205 : 235) * s
  const hubRing = memberRing + 62 * s
  const leafRing = memberRing + 118 * s

  members.forEach((m, i) => {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2
    m.baseAngle = angle
    m.baseDistance = memberRing
    orientEmployeeHubsCircular(nodes, m.id, angle, hubRing, leafRing)
  })
}

function layoutCompanyCircular(nodes: SolarNode[], s: number) {
  const managers = nodes.filter((n) => n.parentId === 'sun' && n.type === 'planet')
  const mCount = managers.length
  const mgrRing = (mCount <= 2 ? 300 : mCount <= 4 ? 355 : 410) * s
  const empRing = mgrRing + 95 * s
  const hubRing = empRing + 58 * s
  const leafRing = empRing + 108 * s

  managers.forEach((mgr, mi) => {
    const sector = (mi / Math.max(mCount, 1)) * Math.PI * 2 - Math.PI / 2
    mgr.baseAngle = sector
    mgr.baseDistance = mgrRing

    const employees = nodes.filter((n) => n.parentId === mgr.id)
    const eCount = employees.length
    const spread = Math.min(Math.PI * 0.72, Math.max(0.5, eCount * 0.28))

    employees.forEach((emp, ei) => {
      const angle =
        eCount === 1
          ? sector
          : sector - spread / 2 + (ei / Math.max(eCount - 1, 1)) * spread
      emp.baseAngle = angle
      emp.baseDistance = empRing
      orientEmployeeHubsCircular(nodes, emp.id, angle, hubRing, leafRing)
    })
  })
}

function orientEmployeeHubsCircular(
  nodes: SolarNode[],
  empId: string,
  facing: number,
  hubRing: number,
  leafRing: number,
) {
  const goalsHub = nodes.find((n) => n.id === `goals-hub-${empId}`)
  const tasksHub = nodes.find((n) => n.id === `tasks-hub-${empId}`)
  if (goalsHub) {
    goalsHub.baseAngle = facing - 0.55
    goalsHub.baseDistance = hubRing
    ringLeaves(
      nodes.filter((n) => n.parentId === goalsHub.id && n.isLeaf),
      facing - 0.55,
      facing - 1.05,
      facing - 0.05,
      leafRing,
    )
  }
  if (tasksHub) {
    tasksHub.baseAngle = facing + 0.55
    tasksHub.baseDistance = hubRing
    ringLeaves(
      nodes.filter((n) => n.parentId === tasksHub.id && n.isLeaf),
      facing + 0.55,
      facing + 0.05,
      facing + 1.05,
      leafRing,
    )
  }
}

/** Distribute leaves between angleStart and angleEnd on a ring from center. */
function ringLeaves(
  leaves: SolarNode[],
  hubAngle: number,
  angleStart: number,
  angleEnd: number,
  ringDistance: number,
) {
  const n = leaves.length
  if (n === 0) return
  if (n === 1) {
    leaves[0].baseAngle = hubAngle
    leaves[0].baseDistance = ringDistance
    return
  }
  leaves.forEach((leaf, i) => {
    leaf.baseAngle = angleStart + (i / (n - 1)) * (angleEnd - angleStart)
    leaf.baseDistance = ringDistance
  })
}
