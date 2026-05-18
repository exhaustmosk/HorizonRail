// ─── Notification Service ─────────────────────────────────────────────────────
// Central dispatch for email & Teams notifications.
// Calls Supabase Edge Function 'send-notification' to keep API keys server-side.
// Falls back to console logging in development if Edge Functions aren't deployed.

import { supabase } from './supabase'
import {
  goalSheetLink,
  managerGoalSheetLink,
  checkInLink,
  joinRequestsLink,
} from './deepLinks'

// ─── Types ───────────────────────────────────────────────────────────────────

export type NotificationEventType =
  | 'goal_submitted'
  | 'goal_approved'
  | 'goal_rejected'
  | 'checkin_reminder'
  | 'join_request'

interface NotificationPayload {
  type: NotificationEventType
  recipient_email: string
  recipient_name: string
  subject: string
  body_html: string
  deep_link: string
  // Teams-specific
  teams_webhook_url?: string
  teams_card?: TeamsAdaptiveCard
  // Metadata
  org_id?: string
  actor_name?: string
}

interface TeamsAdaptiveCard {
  title: string
  subtitle: string
  facts: { name: string; value: string }[]
  action_url: string
  action_label: string
}

// ─── Preference Checking ─────────────────────────────────────────────────────

interface NotificationPrefs {
  email_enabled: boolean
  teams_enabled: boolean
  on_goal_submitted: boolean
  on_goal_approved: boolean
  on_goal_rejected: boolean
  on_checkin_reminder: boolean
  on_join_request: boolean
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_enabled: true,
  teams_enabled: true,
  on_goal_submitted: true,
  on_goal_approved: true,
  on_goal_rejected: true,
  on_checkin_reminder: true,
  on_join_request: true,
}

async function getUserPrefs(userId: string): Promise<NotificationPrefs> {
  const { data } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data ? (data as unknown as NotificationPrefs) : DEFAULT_PREFS
}

async function getOrgConfig(orgId: string): Promise<{ teams_webhook_url?: string; enabled: boolean }> {
  const { data } = await supabase
    .from('org_notification_config')
    .select('*')
    .eq('org_id', orgId)
    .single()
  return data
    ? { teams_webhook_url: data.teams_webhook_url as string | undefined, enabled: Boolean(data.enabled) }
    : { enabled: false }
}

function shouldNotify(prefs: NotificationPrefs, event: NotificationEventType): boolean {
  const eventKey = `on_${event}` as keyof NotificationPrefs
  return Boolean(prefs[eventKey])
}

// ─── Core Dispatch ───────────────────────────────────────────────────────────

async function dispatch(payload: NotificationPayload): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: payload,
    })
    if (error) {
      console.warn('[Notification] Edge function error:', error.message)
      // Fallback: log to console in dev
      console.info('[Notification] Would have sent:', payload.type, 'to', payload.recipient_email)
    }
  } catch (err) {
    // Edge Functions not deployed — graceful degradation
    console.info('[Notification] Service unavailable — event logged locally:', payload.type)
    console.debug('[Notification] Payload:', JSON.stringify(payload, null, 2))
  }
}

// ─── Email HTML Templates ────────────────────────────────────────────────────

function emailTemplate(
  heading: string,
  bodyText: string,
  ctaLabel: string,
  ctaUrl: string,
  accentColor = '#8B5CF6',
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0914;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">
  <!-- Logo -->
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${accentColor},#4C1D95);line-height:40px;text-align:center;">
      <span style="color:#fff;font-weight:700;font-size:16px;">H</span>
    </div>
    <p style="color:#a78bfa;font-size:14px;font-weight:600;margin:8px 0 0;">HorizonRail</p>
  </div>
  <!-- Card -->
  <div style="background:#12101f;border:1px solid rgba(139,92,246,0.2);border-radius:16px;padding:32px;box-shadow:0 0 40px rgba(139,92,246,0.08);">
    <h1 style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 12px;">${heading}</h1>
    <p style="color:#94a3b8;font-size:14px;line-height:1.7;margin:0 0 24px;">${bodyText}</p>
    <a href="${ctaUrl}" style="display:inline-block;background:${accentColor};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:10px;box-shadow:0 0 20px rgba(139,92,246,0.3);">${ctaLabel}</a>
  </div>
  <!-- Footer -->
  <p style="color:#475569;font-size:11px;text-align:center;margin-top:32px;">
    © 2026 HorizonRail · <a href="${ctaUrl}" style="color:#7c3aed;text-decoration:none;">Open App</a>
  </p>
</div>
</body>
</html>`
}

// ─── Teams Adaptive Card Builder ─────────────────────────────────────────────

function buildTeamsCard(
  title: string,
  subtitle: string,
  facts: { name: string; value: string }[],
  actionUrl: string,
  actionLabel = 'Open in HorizonRail',
): TeamsAdaptiveCard {
  return { title, subtitle, facts, action_url: actionUrl, action_label: actionLabel }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Notify manager when an employee submits their goal sheet
 */
export async function notifyGoalSubmitted(
  employeeName: string,
  employeeEmail: string,
  managerUserId: string,
  managerEmail: string,
  managerName: string,
  goalCount: number,
  orgId?: string,
): Promise<void> {
  const prefs = await getUserPrefs(managerUserId)
  if (!shouldNotify(prefs, 'goal_submitted')) return

  const deepLink = managerGoalSheetLink()
  const payload: NotificationPayload = {
    type: 'goal_submitted',
    recipient_email: managerEmail,
    recipient_name: managerName,
    subject: `🎯 Goal Sheet Submitted — ${employeeName}`,
    body_html: emailTemplate(
      'Goal Sheet Submitted',
      `<strong>${employeeName}</strong> has submitted ${goalCount} goal${goalCount !== 1 ? 's' : ''} for your review. Please log in to review, edit, or approve the goal sheet.`,
      'Review Goals',
      deepLink,
    ),
    deep_link: deepLink,
    actor_name: employeeName,
    org_id: orgId,
  }

  // Attach Teams card if org has webhook
  if (prefs.teams_enabled && orgId) {
    const orgConfig = await getOrgConfig(orgId)
    if (orgConfig.enabled && orgConfig.teams_webhook_url) {
      payload.teams_webhook_url = orgConfig.teams_webhook_url
      payload.teams_card = buildTeamsCard(
        '🎯 Goal Sheet Submitted',
        `${employeeName} submitted their goal sheet`,
        [
          { name: 'Employee', value: employeeName },
          { name: 'Goals', value: `${goalCount} goal${goalCount !== 1 ? 's' : ''}` },
          { name: 'Action Required', value: 'Review & Approve' },
        ],
        deepLink,
      )
    }
  }

  await dispatch(payload)
}

/**
 * Notify employee when their goal is approved
 */
export async function notifyGoalApproved(
  employeeUserId: string,
  employeeEmail: string,
  employeeName: string,
  goalTitle: string,
  managerName: string,
  orgId?: string,
): Promise<void> {
  const prefs = await getUserPrefs(employeeUserId)
  if (!shouldNotify(prefs, 'goal_approved')) return

  const deepLink = goalSheetLink()
  const payload: NotificationPayload = {
    type: 'goal_approved',
    recipient_email: employeeEmail,
    recipient_name: employeeName,
    subject: `✅ Goal Approved — ${goalTitle}`,
    body_html: emailTemplate(
      'Goal Approved & Locked',
      `Great news! Your goal "<strong>${goalTitle}</strong>" has been approved by <strong>${managerName}</strong> and is now locked for the cycle. You can track your progress in check-ins.`,
      'View My Goals',
      deepLink,
      '#10B981',
    ),
    deep_link: deepLink,
    actor_name: managerName,
    org_id: orgId,
  }

  if (prefs.teams_enabled && orgId) {
    const orgConfig = await getOrgConfig(orgId)
    if (orgConfig.enabled && orgConfig.teams_webhook_url) {
      payload.teams_webhook_url = orgConfig.teams_webhook_url
      payload.teams_card = buildTeamsCard(
        '✅ Goal Approved',
        `${managerName} approved a goal for ${employeeName}`,
        [
          { name: 'Employee', value: employeeName },
          { name: 'Goal', value: goalTitle },
          { name: 'Status', value: 'Approved & Locked' },
        ],
        deepLink,
      )
    }
  }

  await dispatch(payload)
}

/**
 * Notify employee when their goal is returned for rework
 */
export async function notifyGoalRejected(
  employeeUserId: string,
  employeeEmail: string,
  employeeName: string,
  goalTitle: string,
  managerName: string,
  reason: string,
  orgId?: string,
): Promise<void> {
  const prefs = await getUserPrefs(employeeUserId)
  if (!shouldNotify(prefs, 'goal_rejected')) return

  const deepLink = goalSheetLink()
  const payload: NotificationPayload = {
    type: 'goal_rejected',
    recipient_email: employeeEmail,
    recipient_name: employeeName,
    subject: `🔄 Goal Returned for Rework — ${goalTitle}`,
    body_html: emailTemplate(
      'Goal Returned for Rework',
      `Your goal "<strong>${goalTitle}</strong>" was returned by <strong>${managerName}</strong> with the following feedback:<br><br><div style="border-left:3px solid #f59e0b;padding:8px 16px;background:rgba(245,158,11,0.05);border-radius:0 8px 8px 0;color:#fbbf24;font-style:italic;margin:8px 0;">${reason}</div><br>Please update the goal and resubmit for approval.`,
      'Edit My Goals',
      deepLink,
      '#F59E0B',
    ),
    deep_link: deepLink,
    actor_name: managerName,
    org_id: orgId,
  }

  if (prefs.teams_enabled && orgId) {
    const orgConfig = await getOrgConfig(orgId)
    if (orgConfig.enabled && orgConfig.teams_webhook_url) {
      payload.teams_webhook_url = orgConfig.teams_webhook_url
      payload.teams_card = buildTeamsCard(
        '🔄 Goal Returned for Rework',
        `${managerName} returned a goal for ${employeeName}`,
        [
          { name: 'Employee', value: employeeName },
          { name: 'Goal', value: goalTitle },
          { name: 'Feedback', value: reason.slice(0, 100) },
        ],
        deepLink,
      )
    }
  }

  await dispatch(payload)
}

/**
 * Notify team members about an upcoming check-in window
 */
export async function notifyCheckInReminder(
  recipients: { userId: string; email: string; name: string }[],
  periodLabel: string,
  quarter: string,
  closesAt: Date,
  orgId?: string,
): Promise<void> {
  const deepLink = checkInLink(quarter)
  const daysLeft = Math.ceil((closesAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  for (const r of recipients) {
    const prefs = await getUserPrefs(r.userId)
    if (!shouldNotify(prefs, 'checkin_reminder')) continue

    await dispatch({
      type: 'checkin_reminder',
      recipient_email: r.email,
      recipient_name: r.name,
      subject: `⏰ Check-in Reminder — ${periodLabel}`,
      body_html: emailTemplate(
        `${periodLabel} Check-in Reminder`,
        `Hi <strong>${r.name}</strong>,<br><br>The <strong>${periodLabel}</strong> window is open and closes in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong> (${closesAt.toLocaleDateString()}). Please submit your quarterly achievements before the deadline.`,
        'Submit Check-in',
        deepLink,
        '#6366F1',
      ),
      deep_link: deepLink,
      org_id: orgId,
    })
  }
}

/**
 * Notify admin when someone requests to join the org
 */
export async function notifyJoinRequest(
  adminUserId: string,
  adminEmail: string,
  adminName: string,
  requesterName: string,
  requesterEmail: string,
  requesterRole: string,
  department: string,
  orgId?: string,
): Promise<void> {
  const prefs = await getUserPrefs(adminUserId)
  if (!shouldNotify(prefs, 'join_request')) return

  const deepLink = joinRequestsLink()
  const payload: NotificationPayload = {
    type: 'join_request',
    recipient_email: adminEmail,
    recipient_name: adminName,
    subject: `👋 New Join Request — ${requesterName}`,
    body_html: emailTemplate(
      'New Join Request',
      `<strong>${requesterName}</strong> (${requesterEmail}) has requested to join your organization as a <strong>${requesterRole}</strong> in the <strong>${department}</strong> department. Please review and approve or deny this request.`,
      'Review Requests',
      deepLink,
    ),
    deep_link: deepLink,
    actor_name: requesterName,
    org_id: orgId,
  }

  if (prefs.teams_enabled && orgId) {
    const orgConfig = await getOrgConfig(orgId)
    if (orgConfig.enabled && orgConfig.teams_webhook_url) {
      payload.teams_webhook_url = orgConfig.teams_webhook_url
      payload.teams_card = buildTeamsCard(
        '👋 New Join Request',
        `${requesterName} wants to join your organization`,
        [
          { name: 'Name', value: requesterName },
          { name: 'Email', value: requesterEmail },
          { name: 'Role', value: requesterRole },
          { name: 'Department', value: department },
        ],
        deepLink,
        'Review Request',
      )
    }
  }

  await dispatch(payload)
}

// ─── Notification Settings CRUD ──────────────────────────────────────────────

export async function getNotificationSettings(userId: string): Promise<NotificationPrefs> {
  return getUserPrefs(userId)
}

export async function saveNotificationSettings(
  userId: string,
  settings: Partial<NotificationPrefs>,
): Promise<void> {
  const { error } = await supabase
    .from('notification_settings')
    .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) console.error('[Notification] Failed to save settings:', error.message)
}

// ─── Org Notification Config CRUD ────────────────────────────────────────────

export async function getOrgNotificationConfig(
  orgId: string,
): Promise<{ teams_webhook_url: string; enabled: boolean; sender_name: string }> {
  const { data } = await supabase
    .from('org_notification_config')
    .select('*')
    .eq('org_id', orgId)
    .single()
  return data
    ? {
        teams_webhook_url: (data.teams_webhook_url as string) ?? '',
        enabled: Boolean(data.enabled),
        sender_name: (data.sender_name as string) ?? 'HorizonRail',
      }
    : { teams_webhook_url: '', enabled: false, sender_name: 'HorizonRail' }
}

export async function saveOrgNotificationConfig(
  orgId: string,
  config: { teams_webhook_url?: string; enabled?: boolean; sender_name?: string },
): Promise<void> {
  const { error } = await supabase
    .from('org_notification_config')
    .upsert({ org_id: orgId, ...config }, { onConflict: 'org_id' })
  if (error) console.error('[Notification] Failed to save org config:', error.message)
}

/**
 * Send a test message to the configured Teams webhook
 */
export async function testTeamsWebhook(webhookUrl: string): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke('send-notification', {
      body: {
        type: 'test',
        teams_webhook_url: webhookUrl,
        teams_card: buildTeamsCard(
          '🧪 Test Notification',
          'HorizonRail Teams integration is working!',
          [
            { name: 'Status', value: 'Connected ✅' },
            { name: 'Time', value: new Date().toLocaleString() },
          ],
          typeof window !== 'undefined' ? window.location.origin : 'https://horizonrail.app',
          'Open HorizonRail',
        ),
      },
    })
    return !error
  } catch {
    console.warn('[Notification] Test webhook failed — Edge Function may not be deployed')
    return false
  }
}
