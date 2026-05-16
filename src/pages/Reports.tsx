import { useState } from 'react'
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
import { useOrgStore } from '../store/orgStore'
import { computeScore } from '../lib/scoreEngine'
import Topbar from '../components/layout/Topbar'
import AchievementReport from '../components/reports/AchievementReport'
import HeatmapWidget from '../components/reports/HeatmapWidget'

export default function Reports() {
  const employees = useOrgStore((s) => s.employees)
  const reports = employees.filter((e) => e.role === 'employee')
  const [hidden, setHidden] = useState<Record<string, boolean>>({})

  const trendData = ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
    const row: Record<string, string | number> = { quarter: q }
    reports.forEach((emp) => {
      const scores = emp.goals.map((g) => {
        const actual =
          g.quarterlyActuals.find((a) => a.quarter === q)?.actual ??
          (q === 'Q1' ? 0 : undefined)
        if (actual === undefined) return null
        return computeScore(g, actual)
      })
      const valid = scores.filter((s): s is number => s !== null)
      row[emp.name] =
        valid.length > 0
          ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length)
          : 0
    })
    return row
  })

  const colors = ['#6C63FF', '#1D9E75', '#378ADD', '#F59E0B', '#E24B4A']

  return (
    <>
      <Topbar title="Reports" />
      <div className="space-y-8 p-6">
        <section>
          <h2 className="mb-4 font-heading font-bold">Achievement Report</h2>
          <AchievementReport employees={employees} />
        </section>

        <section>
          <h2 className="mb-4 font-heading font-bold">Heatmap</h2>
          <HeatmapWidget employees={employees} />
        </section>

        <section>
          <h2 className="mb-4 font-heading font-bold">QoQ Trend</h2>
          <div className="rounded-xl border border-[var(--border-subtle)] bg-bg-surface p-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="quarter" stroke="#888780" />
                <YAxis stroke="#888780" domain={[0, 150]} />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A2E',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                />
                <Legend
                  onClick={(e) => {
                    const key = e.value as string
                    setHidden((h) => ({ ...h, [key]: !h[key] }))
                  }}
                />
                {reports.map((emp, i) =>
                  hidden[emp.name] ? null : (
                    <Line
                      key={emp.id}
                      type="monotone"
                      dataKey={emp.name}
                      stroke={colors[i % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ),
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  )
}
