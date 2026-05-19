import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { useOrgStore } from '../../store/orgStore'
import { resolveActivePeriod } from '../../lib/checkInSchedule'
import { useLiveClock } from '../../hooks/useLiveClock'

const CORPORATE_COLORS = ['#1e40af', '#0f766e', '#3b82f6', '#14b8a6', '#64748b', '#475569']
const STATUS_COLORS = {
  completed: '#10b981', // Emerald 500
  on_track: '#3b82f6',  // Blue 500
  at_risk: '#f59e0b',   // Amber 500
  not_started: '#64748b' // Slate 500
}

export default function GoalDistribution() {
  const employees = useOrgStore((s) => s.employees)
  const periods = useOrgStore((s) => s.checkInPeriods)
  const now = useLiveClock()
  
  const activePeriod = resolveActivePeriod(periods, now)

  const { thrustData, uomData, statusData } = useMemo(() => {
    const thrustCounts: Record<string, number> = {}
    const uomCounts: Record<string, number> = {}
    const statusCounts: Record<string, number> = {
      completed: 0,
      on_track: 0,
      at_risk: 0,
      not_started: 0
    }

    employees.forEach(emp => {
      emp.goals.forEach(goal => {
        // Thrust Area
        thrustCounts[goal.thrustArea] = (thrustCounts[goal.thrustArea] || 0) + 1
        
        // UoM
        const uomLabel = goal.uom === 'numeric_max' ? 'Maximize' : 
                         goal.uom === 'numeric_min' ? 'Minimize' : 
                         goal.uom === 'timeline' ? 'Timeline' : 'Zero Target'
        uomCounts[uomLabel] = (uomCounts[uomLabel] || 0) + 1

        // Status (from current quarter, or fallback to latest)
        let currentStatus = 'not_started'
        if (activePeriod && activePeriod.quarter !== 'goal_setting') {
          const actual = goal.quarterlyActuals.find(a => a.quarter === activePeriod.quarter)
          if (actual) currentStatus = actual.status
        } else if (goal.quarterlyActuals.length > 0) {
          // Find latest submitted
          const latest = [...goal.quarterlyActuals].sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())[0]
          currentStatus = latest.status
        }
        
        if (currentStatus in statusCounts) {
          statusCounts[currentStatus as keyof typeof statusCounts]++
        }
      })
    })

    return {
      thrustData: Object.entries(thrustCounts).map(([name, value]) => ({ name, value })),
      uomData: Object.entries(uomCounts).map(([name, value]) => ({ name, value })),
      statusData: Object.entries(statusCounts).map(([name, value]) => ({ 
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
        value,
        originalKey: name
      })).filter(d => d.value > 0)
    }
  }, [employees, activePeriod])

  const renderCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-[#334155] p-2 rounded shadow-lg text-sm">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-slate-300">{payload[0].value} Goals</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Thrust Area */}
      <div className="rounded-xl border border-white/10 bg-[#151b2b] p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white text-center mb-4">By Thrust Area</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={thrustData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {thrustData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORPORATE_COLORS[index % CORPORATE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* UoM Type */}
      <div className="rounded-xl border border-white/10 bg-[#151b2b] p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white text-center mb-4">By Measurement Type</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={uomData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {uomData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CORPORATE_COLORS[(index + 2) % CORPORATE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status */}
      <div className="rounded-xl border border-white/10 bg-[#151b2b] p-6 shadow-lg">
        <h3 className="text-sm font-bold text-white text-center mb-4">Current Status</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.originalKey as keyof typeof STATUS_COLORS] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={renderCustomTooltip} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
