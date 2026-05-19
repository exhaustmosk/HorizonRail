import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { COMPANY_NAME } from '../lib/constants'
import NeuronGraph from '../components/neuron/NeuronGraph'
import Topbar from '../components/layout/Topbar'

export default function NeuronMap() {
  const user = useAuthStore((s) => s.user)
  const employees = useOrgStore((s) => s.employees)
  const getDirectReports = useOrgStore((s) => s.getDirectReports)

  if (!user) return null

  const emp = employees.find((e) => e.id === user.id) ?? user

  return (
    <>
      <Topbar title="Neuron Alignment Map" />
      <div className="relative w-full h-[calc(100vh-3.5rem)] bg-[#0b0914] overflow-hidden">
        {user.role === 'admin' && (
          <NeuronGraph mode="company" employees={employees} companyName={COMPANY_NAME} />
        )}

        {user.role === 'manager' && (
          <NeuronGraph
            mode="team"
            manager={emp}
            reports={getDirectReports(user.id)}
            companyName={COMPANY_NAME}
          />
        )}

        {user.role === 'employee' && <NeuronGraph mode="personal" employee={emp} />}
      </div>
    </>
  )
}
