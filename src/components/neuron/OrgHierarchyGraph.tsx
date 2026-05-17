import type { Employee } from '../../types'
import NeuronGraph from './NeuronGraph'

export type OrgGraphMode = 'team' | 'company'

interface OrgHierarchyGraphProps {
  mode: OrgGraphMode
  manager?: Employee
  reports?: Employee[]
  employees?: Employee[]
  companyName: string
}

/** @deprecated Use NeuronGraph with mode="team" or mode="company" */
export default function OrgHierarchyGraph({
  mode,
  manager,
  reports = [],
  employees = [],
  companyName,
}: OrgHierarchyGraphProps) {
  if (mode === 'team' && manager) {
    return (
      <NeuronGraph mode="team" manager={manager} reports={reports} companyName={companyName} />
    )
  }
  return <NeuronGraph mode="company" employees={employees} companyName={companyName} />
}
