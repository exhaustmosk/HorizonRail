import { supabase } from './supabase'
import type { EscalationPolicy, Employee, CheckInPeriod } from '../types'
import { resolveActivePeriod } from './checkInSchedule'

/**
 * MOCK ESCALATION ENGINE (For Hackathon Demo)
 * In production, this would be an Edge Function scheduled via pg_cron to run nightly.
 * For the demo, this runs completely client-side when the Admin clicks the button.
 */
export async function runEscalationEngine(
  orgId: string,
  policies: EscalationPolicy[],
  employees: Employee[],
  periods: CheckInPeriod[]
): Promise<number> {
  let triggersCount = 0
  const now = new Date()

  // Find active goal setting period
  const goalPeriod = periods.find((p) => p.quarter === 'goal_setting')
  const activeCheckinPeriod = resolveActivePeriod(periods, now)

  for (const policy of policies.filter((p) => p.enabled)) {
    for (const emp of employees.filter((e) => e.role === 'employee')) {
      let isTriggered = false

      if (policy.condition === 'no_goals_submitted') {
        if (goalPeriod && emp.goals.length === 0) {
          const daysElapsed = Math.floor((now.getTime() - goalPeriod.openDate.getTime()) / (1000 * 60 * 60 * 24))
          if (daysElapsed >= policy.daysThreshold) isTriggered = true
        }
      } 
      
      else if (policy.condition === 'goals_unapproved') {
        const unapprovedGoals = emp.goals.filter((g) => g.approvalStatus === 'submitted')
        if (unapprovedGoals.length > 0) {
          // Find the oldest submitted goal
          const oldest = new Date(Math.min(...unapprovedGoals.map((g) => g.updatedAt.getTime())))
          const daysElapsed = Math.floor((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24))
          if (daysElapsed >= policy.daysThreshold) isTriggered = true
        }
      }

      else if (policy.condition === 'checkin_missed') {
        // If there's an active check-in window, and they haven't submitted actuals for it
        if (activeCheckinPeriod && activeCheckinPeriod.quarter !== 'goal_setting') {
          const hasCheckedIn = emp.goals.some((g) => 
            g.quarterlyActuals.some((qa) => qa.quarter === activeCheckinPeriod.quarter)
          )
          
          if (!hasCheckedIn) {
            const daysElapsed = Math.floor((now.getTime() - activeCheckinPeriod.openDate.getTime()) / (1000 * 60 * 60 * 24))
            if (daysElapsed >= policy.daysThreshold) isTriggered = true
          }
        }
      }

      // If triggered, verify we haven't already logged this exact incident and left it open
      if (isTriggered) {
        const { data: existingLog } = await supabase
          .from('escalation_logs')
          .select('id')
          .eq('policy_id', policy.id)
          .eq('employee_id', emp.id)
          .eq('status', 'open')
          .limit(1)

        if (!existingLog || existingLog.length === 0) {
          // Log it
          await supabase.from('escalation_logs').insert({
            org_id: orgId,
            policy_id: policy.id,
            employee_id: emp.id,
            status: 'open'
          })
          triggersCount++
        }
      }
    }
  }

  return triggersCount
}
