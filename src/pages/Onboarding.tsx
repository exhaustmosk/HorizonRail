import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building, Send, Clock, LogOut, Briefcase } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import { PRODUCT_NAME } from '../lib/constants'

export default function Onboarding() {
  const authUser = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  // Grab the live user status from the OrgStore to react to Admin approvals instantly
  const user = useOrgStore((s) => s.employees.find((e) => e.id === authUser?.id)) || authUser
  const organizations = useOrgStore((s) => s.getOrganizations())
  const requestToJoin = useOrgStore((s) => s.requestToJoinOrganization)
  const cancelRequest = useOrgStore((s) => s.cancelJoinRequest)
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [customOrgName, setCustomOrgName] = useState('')
  const [department, setDepartment] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return null
  }

  // If approved already, navigate away!
  if (user.organizationStatus === 'joined') {
    if (user.role === 'admin') navigate('/admin')
    else if (user.role === 'manager') navigate('/manager')
    else navigate('/dashboard')
    return null
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    let orgId = selectedOrgId
    if (isCustom) {
      if (!customOrgName.trim()) {
        setError('Please enter an organization name.')
        return
      }
      // Create a temporary/placeholder organization in OrgStore to allow requesting
      orgId = await useOrgStore.getState().createOrganization(
        customOrgName.trim(),
        'placeholder-admin-id',
        'System Administrator',
        'Technology',
        '10-50 employees'
      )
    } else {
      if (!selectedOrgId) {
        setError('Please select an organization from the list.')
        return
      }
    }

    if (!department.trim()) {
      setError('Please specify your department (e.g., Engineering, Sales).')
      return
    }

    // Update department in the employee object
    useOrgStore.getState().updateEmployee(user.id, { department: department.trim() })

    // Dispatch the join request (manager will be selected after approval)
    requestToJoin(orgId, { ...user, department: department.trim() })
  }

  const handleCancel = () => {
    if (user.organizationId) {
      cancelRequest(user.organizationId, user.id)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-mesh flex flex-col justify-between py-10 px-4">
      {/* Top Brand Nav */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="glass-logo-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-violet-500/50 to-violet-950/80">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-white" aria-hidden>
              <path fill="currentColor" d="M6 14V6h8l-3.2 3.2L14 12.4 10.4 9 6 14z" opacity="0.95" />
              <path fill="currentColor" d="M6 6h3.5L6 9.5V6z" opacity="0.55" />
            </svg>
          </div>
          <span className="font-heading text-lg font-bold text-white tracking-wide">
            {PRODUCT_NAME}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-300"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-lg">
          {user.organizationStatus === 'pending' ? (
            /* Pending Approval View */
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="rounded-3xl border border-purple-strong bg-[#12101f]/90 p-8 text-center shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple via-violet-500 to-purple animate-pulse" />
              
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-purple/35 bg-purple/10">
                <Clock size={28} className="text-accent-glow animate-pulse" />
              </div>

              <h1 className="font-heading text-2xl font-bold text-white mb-2">
                Approval Pending
              </h1>
              <p className="text-sm text-slate-400 mb-6 px-2 leading-relaxed">
                Your request to join <span className="font-semibold text-white">{user.organizationName}</span> as a <span className="capitalize font-semibold text-accent-glow">{user.role}</span> is waiting for the administrator to review and approve.
              </p>

              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 mb-8 text-left space-y-2.5 text-xs text-slate-400">
                <div className="flex justify-between">
                  <span>Department:</span>
                  <span className="text-white font-medium">{user.department}</span>
                </div>
                <div className="flex justify-between">
                  <span>Role:</span>
                  <span className="text-white capitalize font-medium">{user.role}</span>
                </div>
                <div className="flex justify-between">
                  <span>Requested On:</span>
                  <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCancel}
                  className="w-full py-3 rounded-xl border border-red-500/35 bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-all duration-300"
                >
                  Cancel join request & choose another
                </button>
                <p className="text-[10px] text-slate-500">
                  Tip: Once the administrator approves, this page will automatically refresh.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Select Organization View (organizationStatus === 'none') */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-purple-strong bg-[#12101f]/90 p-8 shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
              
              <div className="mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-purple/30 bg-purple/10 mb-4">
                  <Building size={22} className="text-accent-glow" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-white">
                  Join Your Organization
                </h1>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                  To access your performance goals and cycle check-ins, tell us which organization you belong to.
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-5">
                {error && (
                  <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center">
                    {error}
                  </p>
                )}

                {/* Search / Select Toggle */}
                <div className="flex gap-2 rounded-xl border border-white/5 bg-white/5 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(false)
                      setError('')
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      !isCustom ? 'bg-purple/20 text-accent-glow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Select Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(true)
                      setError('')
                    }}
                    className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                      isCustom ? 'bg-purple/20 text-accent-glow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Request New Org
                  </button>
                </div>

                {isCustom ? (
                  /* Custom organization text input */
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Organization Name
                    </label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Apex Labs Inc."
                        value={customOrgName}
                        onChange={(e) => setCustomOrgName(e.target.value)}
                        className="w-full rounded-xl border border-purple bg-[#12101f]/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/30"
                      />
                    </div>
                  </div>
                ) : (
                  /* Dropdown Select organization list */
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Choose Organization
                    </label>
                    <div className="relative">
                      <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <select
                        value={selectedOrgId}
                        onChange={(e) => setSelectedOrgId(e.target.value)}
                        className="w-full rounded-xl border border-purple bg-[#12101f]/70 py-3 pl-10 pr-4 text-sm text-white focus:border-purple-strong focus:outline-none"
                      >
                        <option value="" disabled>Select an organization...</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id} className="bg-[#12101f]">
                            {org.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Department Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your Department
                  </label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Engineering, Sales, Marketing..."
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full rounded-xl border border-purple bg-[#12101f]/70 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:border-purple-strong focus:outline-none focus:ring-1 focus:ring-accent-violet/30"
                    />
                  </div>
                </div>



                <button
                  type="submit"
                  className="w-full mt-6 py-3.5 rounded-xl bg-accent-violet border border-purple-strong text-white font-semibold text-sm shadow-[0_0_24px_rgba(168,85,247,0.25)] hover:bg-accent-violet/90 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  Submit Request to Join
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-slate-600 max-w-4xl mx-auto w-full border-t border-white/5 pt-4">
        © 2026 {PRODUCT_NAME}. Empowering employees and aligning organizations, one rail at a time.
      </footer>
    </div>
  )
}
