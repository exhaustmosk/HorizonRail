import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { COMPANY_NAME } from '../lib/constants'
import NeuronGraph from '../components/neuron/NeuronGraph'

export default function Analysis() {
  const user = useAuthStore((s) => s.user)
  const employees = useOrgStore((s) => s.employees)
  const getDirectReports = useOrgStore((s) => s.getDirectReports)

  if (!user) return null

  const emp = employees.find((e) => e.id === user.id) ?? user

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden">
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
  )
}
