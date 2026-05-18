import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Building2, User, Shield, Bell, MessageSquare, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useOrgStore } from '../store/orgStore'
import Card from '../components/ui/Card'
import { getNotificationSettings, saveNotificationSettings } from '../lib/notificationService'

export default function Profile() {
  const user = useAuthStore((s) => s.user)!
  const employees = useOrgStore((s) => s.employees)
  const emp = employees.find((e) => e.id === user.id) ?? user
  const manager = emp.managerId
    ? employees.find((e) => e.id === emp.managerId)
    : undefined

  const [prefs, setPrefs] = useState({
    email_enabled: true,
    teams_enabled: true,
    on_goal_submitted: true,
    on_goal_approved: true,
    on_goal_rejected: true,
    on_checkin_reminder: true,
    on_join_request: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getNotificationSettings(user.id).then((p) => {
      setPrefs(p)
      setLoading(false)
    })
  }, [user.id])

  const togglePref = async (key: keyof typeof prefs) => {
    const newVal = !prefs[key]
    setPrefs({ ...prefs, [key]: newVal })
    setSaving(true)
    await saveNotificationSettings(user.id, { [key]: newVal })
    setSaving(false)
  }

  return (
    <div className="bg-mesh min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-2xl font-bold">My Profile</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Your HorizonRail account details
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

        {/* Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="mt-6 border-white/5">
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                  <Bell size={18} className="text-accent-glow" />
                  Notifications
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Manage how you receive updates and alerts.
                </p>
              </div>
              {saving && <Loader2 size={16} className="text-slate-400 animate-spin" />}
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading preferences...</div>
            ) : (
              <div className="space-y-6">
                {/* Channels */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Channels</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${prefs.email_enabled ? 'bg-accent-violet/20 text-accent-violet' : 'bg-white/5 text-slate-400'}`}>
                          <Mail size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Email Notifications</p>
                          <p className="text-xs text-slate-400 mt-0.5">Receive updates via {user.email}</p>
                        </div>
                      </div>
                      <div className={`relative h-6 w-11 rounded-full transition-colors ${prefs.email_enabled ? 'bg-accent-violet' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${prefs.email_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                      <input type="checkbox" className="sr-only" checked={prefs.email_enabled} onChange={() => togglePref('email_enabled')} />
                    </label>

                    <label className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 cursor-pointer hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${prefs.teams_enabled ? 'bg-[#5B5FC7]/20 text-[#5B5FC7]' : 'bg-white/5 text-slate-400'}`}>
                          <MessageSquare size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Microsoft Teams</p>
                          <p className="text-xs text-slate-400 mt-0.5">Receive Adaptive Cards in Teams channels</p>
                        </div>
                      </div>
                      <div className={`relative h-6 w-11 rounded-full transition-colors ${prefs.teams_enabled ? 'bg-[#5B5FC7]' : 'bg-slate-700'}`}>
                        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${prefs.teams_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </div>
                      <input type="checkbox" className="sr-only" checked={prefs.teams_enabled} onChange={() => togglePref('teams_enabled')} />
                    </label>
                  </div>
                </div>

                {/* Events */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 mt-8">Events</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'on_goal_submitted', label: 'Goal Submitted', desc: 'When team members submit goals (Managers only)' },
                      { key: 'on_goal_approved', label: 'Goal Approved', desc: 'When your goals are approved' },
                      { key: 'on_goal_rejected', label: 'Goal Returned', desc: 'When your goals need rework' },
                      { key: 'on_checkin_reminder', label: 'Check-in Reminders', desc: 'Upcoming check-in windows' },
                      { key: 'on_join_request', label: 'Join Requests', desc: 'New org join requests (Admins only)' },
                    ].map((event) => (
                      <label key={event.key} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-colors">
                        <div className="mt-0.5 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={prefs[event.key as keyof typeof prefs] as boolean}
                            onChange={() => togglePref(event.key as keyof typeof prefs)}
                            className="h-4 w-4 rounded border-white/20 bg-[#12101f] text-accent-violet focus:ring-accent-violet focus:ring-offset-0"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{event.label}</p>
                          <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{event.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
