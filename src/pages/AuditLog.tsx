import { useMemo, useState } from 'react'
import { useOrgStore } from '../store/orgStore'
import Topbar from '../components/layout/Topbar'
import Button from '../components/ui/Button'

export default function AuditLog() {
  const auditLog = useOrgStore((s) => s.getAuditLog)
  const [actorFilter, setActorFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const entries = useMemo(() => {
    return auditLog().filter((e) => {
      if (actorFilter && !e.actorName.toLowerCase().includes(actorFilter.toLowerCase()))
        return false
      if (actionFilter && e.action !== actionFilter) return false
      return true
    })
  }, [auditLog, actorFilter, actionFilter])

  const actions = [...new Set(auditLog().map((e) => e.action))]

  const exportCsv = () => {
    const header = 'Timestamp,Actor,Action,Target,Old,New\n'
    const rows = entries
      .map(
        (e) =>
          `${e.timestamp.toISOString()},${e.actorName},${e.action},${e.targetLabel},${e.oldValue},${e.newValue}`,
      )
      .join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
  }

  return (
    <>
      <Topbar
        title="Audit Log"
        actions={
          <Button variant="secondary" onClick={exportCsv}>
            Export CSV
          </Button>
        }
      />
      <div className="p-6">
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Filter by actor..."
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-bg-elevated px-3 py-2 text-sm"
          >
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Old value</th>
                <th className="p-3">New value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-[var(--border-subtle)] last:border-0"
                >
                  <td className="p-3 text-xs">{e.timestamp.toLocaleString()}</td>
                  <td className="p-3">{e.actorName}</td>
                  <td className="p-3">{e.action}</td>
                  <td className="p-3">{e.targetLabel}</td>
                  <td className="p-3 text-xs text-[var(--text-secondary)]">
                    {e.oldValue}
                  </td>
                  <td className="p-3 text-xs">{e.newValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
