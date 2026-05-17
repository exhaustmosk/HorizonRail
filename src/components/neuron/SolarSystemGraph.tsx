import type { Employee } from '../../types'
import NeuronGraph from './NeuronGraph'

/** @deprecated Use NeuronGraph with mode="personal" */
export default function SolarSystemGraph({ employee }: { employee: Employee }) {
  return <NeuronGraph mode="personal" employee={employee} />
}
