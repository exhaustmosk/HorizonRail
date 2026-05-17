import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import type { Employee } from '../../types'
import { computeScore, computeWeightedScore } from '../../lib/scoreEngine'
import Button from '../ui/Button'

interface AchievementReportProps {
  employees: Employee[]
}

export default function AchievementReport({ employees }: AchievementReportProps) {
  const [department, setDepartment] = useState('all')
  const [quarter, setQuarter] = useState('Q1')

  const rows = useMemo(() => {
    return employees
      .filter((e) => e.role === 'employee')
      .filter((e) => department === 'all' || e.department === department)
      .flatMap((emp) =>
         emp.goals.map((goal) => {
          const getQ = (q: string) => {
            const actual = goal.quarterlyActuals.find((a) => a.quarter === q)?.actual
            if (actual === undefined || actual === null) return ''
            if (goal.uom === 'timeline') {
              return actual ? new Date(actual).toLocaleDateString() : ''
            }
            return actual
          }
          return {
            employee: emp.name,
            department: emp.department,
            goal: goal.title,
            thrust: goal.thrustArea,
            target: goal.uom === 'timeline' && goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : goal.target,
            Q1: getQ('Q1'),
            Q2: getQ('Q2'),
            Q3: getQ('Q3'),
            Q4: getQ('Q4'),
            weighted: Math.round(computeWeightedScore(emp.goals)),
            score: Math.round(
              computeScore(
                goal,
                goal.quarterlyActuals.find((a) => a.quarter === quarter)?.actual ??
                  goal.quarterlyActuals.at(-1)?.actual ??
                  0,
              ),
            ),
          }
        }),
      )
  }, [employees, department, quarter])

  const departments = [
    'all',
    ...new Set(employees.map((e) => e.department)),
  ]

  const exportCsv = () => {
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Achievement')
    XLSX.writeFile(wb, 'achievement-report.xlsx')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d === 'all' ? 'All departments' : d}
            </option>
          ))}
        </select>
        <select
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
        >
          {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={exportCsv}>
          Export Excel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
              <th className="p-3">Employee</th>
              <th className="p-3">Goal</th>
              <th className="p-3">Target</th>
              <th className="p-3">Q1</th>
              <th className="p-3">Q2</th>
              <th className="p-3">Q3</th>
              <th className="p-3">Q4</th>
              <th className="p-3">Score</th>
              <th className="p-3">Weighted</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border-subtle)] last:border-0"
              >
                <td className="p-3">{r.employee}</td>
                <td className="p-3">{r.goal}</td>
                <td className="p-3">{r.target}</td>
                <td className="p-3">{r.Q1}</td>
                <td className="p-3">{r.Q2}</td>
                <td className="p-3">{r.Q3}</td>
                <td className="p-3">{r.Q4}</td>
                <td className="p-3">{r.score}%</td>
                <td className="p-3">{r.weighted}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
