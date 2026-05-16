import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import SolarSystemGraph from '../components/neuron/SolarSystemGraph'

export default function Analysis() {
  const user = useAuthStore((s) => s.user)
  const employees = useOrgStore((s) => s.employees)

  if (!user) return null

  const emp = employees.find((e) => e.id === user.id) ?? user

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col overflow-hidden">
      <SolarSystemGraph employee={emp} />
    </div>
  )
}
