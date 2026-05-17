import { motion } from 'framer-motion'
import { Mail, Building2, User, Shield } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import Card from '../components/ui/Card'

export default function Profile() {
  const user = useAuthStore((s) => s.user)!
  const employees = useOrgStore((s) => s.employees)
  const emp = employees.find((e) => e.id === user.id) ?? user
  const manager = emp.managerId
    ? employees.find((e) => e.id === emp.managerId)
    : undefined

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold">My Profile</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your AtomQuest account details
          </p>
        </motion.div>

        <Card className="mt-6 border-purple glow-purple-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-800 font-heading text-xl font-bold text-white">
              {user.initials}
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold">{user.name}</h2>
              <p className="text-sm capitalize text-[var(--text-secondary)]">{user.role}</p>
            </div>
          </div>

          <ul className="mt-8 space-y-4">
            <li className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-accent-glow" />
              <span className="text-[var(--text-secondary)]">{user.email}</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Building2 size={16} className="text-accent-glow" />
              <span className="text-[var(--text-secondary)]">{user.department}</span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <User size={16} className="text-accent-glow" />
              <span className="text-[var(--text-secondary)]">
                {manager ? `Reports to ${manager.name}` : 'No manager assigned'}
              </span>
            </li>
            <li className="flex items-center gap-3 text-sm">
              <Shield size={16} className="text-accent-glow" />
              <span className="text-[var(--text-secondary)]">
                {emp.goals.length} active goals this cycle
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
