// src/lib/supabase.ts
// Central Supabase client — import this everywhere
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env.local file.\n' +
    'Copy .env.example to .env.local and fill in your Supabase project credentials.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session in localStorage so page refresh keeps you logged in
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // Handles email confirmation redirects automatically
  },
})

// ---------------------------------------------------------------------------
// Database type helpers (mirrors the Supabase schema)
// ---------------------------------------------------------------------------
export type DbProfile = {
  id: string
  name: string
  initials: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  department: string
  manager_id: string | null
  org_id: string | null
  org_name: string | null
  org_status: 'none' | 'pending' | 'joined'
  created_at: string
  updated_at: string
}

export type DbOrganization = {
  id: string
  name: string
  industry: string
  size: string
  admin_id: string
  admin_name: string
  created_at: string
}

export type DbJoinRequest = {
  id: string
  org_id: string
  employee_id: string
  employee_name: string
  employee_email: string
  employee_role: 'employee' | 'manager'
  department: string
  requested_at: string
}

export type DbGoal = {
  id: string
  employee_id: string
  org_id: string
  thrust_area: string
  title: string
  description: string
  uom: 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'
  target: number
  target_date: string | null
  weightage: number
  is_admin_pushed: boolean
  approval_status: 'draft' | 'submitted' | 'approved' | 'rejected'
  locked: boolean
  created_at: string
  updated_at: string
}

export type DbQuarterlyActual = {
  id: string
  goal_id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  planned: number
  actual: number
  status: 'not_started' | 'on_track' | 'completed' | 'at_risk'
  employee_notes: string
  manager_comment: string
  submitted_at: string
}

export type DbCheckinComment = {
  id: string
  goal_id: string
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  summary: string
  strengths: string
  blockers: string
  next_steps: string
  manager_id: string
  manager_name: string
  submitted_at: string
}

export type DbCyclePolicy = {
  id: string
  org_id: string
  max_goals: number
  min_goals: number
  min_weightage_per_goal: number
  total_weightage_required: number
  checkins_mandatory: boolean
  goal_setting_mandatory: boolean
  allow_late_submissions: boolean
  late_submission_grace_days: number
}

export type DbCheckInPeriod = {
  id: string
  org_id: string
  quarter: 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  name: string
  label: string
  action: string
  open_date: string
  close_date: string
  enforced: boolean
}

export type DbChangeRequest = {
  id: string
  org_id: string
  requested_by_id: string
  requested_by_name: string
  requested_at: string
  status: 'pending' | 'approved' | 'rejected'
  reason: string
  summary: string
  target_period: string | null
  policy_patch: Record<string, unknown> | null
  period_patch: Record<string, unknown> | null
  reviewed_by_id: string | null
  reviewed_by_name: string | null
  reviewed_at: string | null
  review_note: string | null
}

export type DbAuditEntry = {
  id: string
  org_id: string | null
  timestamp: string
  actor_id: string
  actor_name: string
  action: string
  target_id: string
  target_label: string
  old_value: string
  new_value: string
}
