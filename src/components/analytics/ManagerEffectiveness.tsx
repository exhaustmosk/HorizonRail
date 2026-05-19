import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useOrgStore } from '../../store/orgStore'
import { resolveActivePeriod } from '../../lib/checkInSchedule'
import { useLiveClock } from '../../hooks/useLiveClock'

export default function ManagerEffectiveness() {
  const employees = useOrgStore((s) => s.employees)
  const periods = useOrgStore((s) => s.checkInPeriods)
  const now = useLiveClock()
  
  const activePeriod = resolveActivePeriod(periods, now)

  const data = useMemo(() => {
    if (!activePeriod || activePeriod.quarter === 'goal_setting') return []

    const managers = employees.filter(e => e.role === 'manager' && e.organizationStatus === 'joined')
    
    return managers.map(manager => {
      const directReports = employees.filter(e => e.managerId === manager.id)
      
      let totalGoals = 0
      let completedCheckins = 0

      directReports.forEach(emp => {
        emp.goals.forEach(goal => {
          totalGoals++
          const hasCheckin = goal.quarterlyActuals.some(a => a.quarter === activePeriod.quarter)
          if (hasCheckin) completedCheckins++
        })
      })

      const completionRate = totalGoals > 0 ? Math.round((completedCheckins / totalGoals) * 100) : 0

      return {
        name: manager.name.split(' ')[0], // First name for chart fit
        fullName: manager.name,
        completionRate,
        totalGoals,
        completedCheckins
      }
    }).sort((a, b) => b.completionRate - a.completionRate) // Sort highest to lowest

  }, [employees, activePeriod])

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#1e293b] border border-[#334155] p-3 rounded shadow-lg text-sm">
          <p className="text-white font-bold mb-1">{data.fullName}</p>
          <p className="text-[#3b82f6]">Completion Rate: {data.completionRate}%</p>
          <p className="text-slate-400 text-xs mt-1">
            {data.completedCheckins} of {data.totalGoals} goal check-ins completed
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#151b2b] p-6 shadow-lg">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Manager Effectiveness</h3>
        <p className="text-sm text-slate-400">
          Check-in completion rate for direct reports ({activePeriod?.quarter || 'Current'} Quarter).
        </p>
      </div>

      {data.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center text-slate-500 italic">
          No check-in data available for the current period.
        </div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
              <YAxis 
                stroke="#94a3b8" 
                axisLine={false} 
                tickLine={false} 
                dx={-10}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip content={renderCustomTooltip} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
              <Bar dataKey="completionRate" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.completionRate >= 80 ? '#10b981' : entry.completionRate >= 50 ? '#3b82f6' : '#f59e0b'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
