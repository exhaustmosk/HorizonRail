import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useOrgStore } from '../../store/orgStore'
import { computeScore } from '../../lib/scoreEngine'
import type { Employee } from '../../types'

const CORPORATE_COLORS = [
  '#1e40af', // Blue 800
  '#0f766e', // Teal 700
  '#475569', // Slate 600
  '#3b82f6', // Blue 500
  '#14b8a6', // Teal 500
  '#94a3b8', // Slate 400
]

export default function QoqTrends() {
  const employees = useOrgStore((s) => s.employees)
  const [aggregation, setAggregation] = useState<'individual' | 'team' | 'department'>('department')
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const trendData = useMemo(() => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
    
    // Group employees based on aggregation level
    const groups: Record<string, Employee[]> = {}
    
    employees.forEach((emp) => {
      if (emp.role !== 'employee') return // Only measure IC performance
      
      let key = ''
      if (aggregation === 'individual') {
        key = emp.name
      } else if (aggregation === 'department') {
        key = emp.department || 'Unknown Dept'
      } else if (aggregation === 'team') {
        const manager = employees.find(m => m.id === emp.managerId)
        key = manager ? `${manager.name}'s Team` : 'Unassigned'
      }
      
      if (!groups[key]) groups[key] = []
      groups[key].push(emp)
    })

    return quarters.map((q) => {
      const row: Record<string, string | number> = { quarter: q }
      
      Object.entries(groups).forEach(([groupName, groupEmps]) => {
        let totalScore = 0
        let validScoresCount = 0

        groupEmps.forEach((emp) => {
          const scores = emp.goals.map((g) => {
            const actual = g.quarterlyActuals.find((a) => a.quarter === q)?.actual ?? (q === 'Q1' ? 0 : undefined)
            if (actual === undefined) return null
            return computeScore(g, actual)
          })
          
          const valid = scores.filter((s): s is number => s !== null)
          if (valid.length > 0) {
            totalScore += valid.reduce((a, b) => a + b, 0) / valid.length
            validScoresCount++
          }
        })

        row[groupName] = validScoresCount > 0 ? Math.round(totalScore / validScoresCount) : 0
      })
      
      return row
    })
  }, [employees, aggregation])

  const lines = Object.keys(trendData[0] || {}).filter(k => k !== 'quarter')

  return (
    <div className="rounded-xl border border-white/10 bg-[#151b2b] p-6 shadow-lg">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Quarter-on-Quarter Trends</h3>
          <p className="text-sm text-slate-400">Average goal achievement scores over time.</p>
        </div>
        <div className="flex bg-[#1e293b] rounded-lg p-1 border border-white/5">
          {(['individual', 'team', 'department'] as const).map((agg) => (
            <button
              key={agg}
              onClick={() => setAggregation(agg)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                aggregation === agg 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {agg}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData}>
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="quarter" stroke="#94a3b8" axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#94a3b8" domain={[0, 150]} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip
              contentStyle={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc'
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              onClick={(e) => {
                const key = e.value as string
                setHidden((h) => ({ ...h, [key]: !h[key] }))
              }}
            />
            {lines.map((key, i) =>
              hidden[key] ? null : (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={CORPORATE_COLORS[i % CORPORATE_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#151b2b' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              )
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
