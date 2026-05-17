import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Employee } from '../types'

interface AuthStore {
  user: Employee | null
  loading: boolean
  authChecked: boolean

  // Supabase Auth actions
  login: (email: string, password: string) => Promise<{ error: string | null }>
  register: (
    name: string,
    email: string,
    password: string,
    role: 'employee' | 'manager' | 'admin',
    department: string,
    orgName?: string,
    industry?: string,
    size?: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>
  logout: () => Promise<void>
  initialize: () => Promise<void>
  setUser: (user: Employee | null) => void
}

// Converts Supabase profile DB row → frontend Employee shape
async function profileToEmployee(profile: Record<string, unknown>): Promise<Employee> {
  // Fetch goals for this employee
  const { data: goals } = await supabase
    .from('goals')
    .select(`*, quarterly_actuals(*), checkin_comments(*)`)
    .eq('employee_id', profile.id as string)
    .order('created_at', { ascending: true })

  const mappedGoals = (goals ?? []).map((g: Record<string, unknown>) => ({
    id: g.id as string,
    employeeId: g.employee_id as string,
    thrustArea: g.thrust_area as string,
    title: g.title as string,
    description: (g.description as string) ?? '',
    uom: g.uom as 'numeric_min' | 'numeric_max' | 'timeline' | 'zero',
    target: Number(g.target),
    targetDate: g.target_date ? new Date(g.target_date as string) : undefined,
    weightage: Number(g.weightage),
    isAdminPushed: Boolean(g.is_admin_pushed),
    approvalStatus: g.approval_status as 'draft' | 'submitted' | 'approved' | 'rejected',
    locked: Boolean(g.locked),
    createdAt: new Date(g.created_at as string),
    updatedAt: new Date(g.updated_at as string),
    quarterlyActuals: ((g.quarterly_actuals as Record<string, unknown>[]) ?? []).map((qa) => {
      const comment = ((g.checkin_comments as Record<string, unknown>[]) ?? []).find(
        (c) => c.quarter === qa.quarter
      )
      return {
        quarter: qa.quarter as 'Q1' | 'Q2' | 'Q3' | 'Q4',
        planned: Number(qa.planned),
        actual: Number(qa.actual),
        status: qa.status as 'not_started' | 'on_track' | 'completed' | 'at_risk',
        employeeNotes: (qa.employee_notes as string) ?? '',
        managerComment: (qa.manager_comment as string) ?? '',
        submittedAt: new Date(qa.submitted_at as string),
        checkInComment: comment
          ? {
              summary: (comment.summary as string) ?? '',
              strengths: (comment.strengths as string) ?? '',
              blockers: (comment.blockers as string) ?? '',
              nextSteps: (comment.next_steps as string) ?? '',
              managerId: comment.manager_id as string,
              managerName: comment.manager_name as string,
              submittedAt: new Date(comment.submitted_at as string),
            }
          : undefined,
      }
    }),
  }))

  return {
    id: profile.id as string,
    name: profile.name as string,
    initials: profile.initials as string,
    email: profile.email as string,
    role: profile.role as 'employee' | 'manager' | 'admin',
    department: profile.department as string,
    managerId: (profile.manager_id as string) ?? undefined,
    organizationId: (profile.org_id as string) ?? undefined,
    organizationName: (profile.org_name as string) ?? undefined,
    organizationStatus: (profile.org_status as 'none' | 'pending' | 'joined') ?? 'none',
    goals: mappedGoals,
  }
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  loading: true,
  authChecked: false,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ loading: true })
    try {
      // Check for an active Supabase session (handles page refresh + email link redirect)
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const employee = await profileToEmployee(profile)
          set({ user: employee })
        }
      }
    } finally {
      set({ loading: false, authChecked: true })
    }

    // Listen for auth changes (login, logout, email confirmation)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          const employee = await profileToEmployee(profile)
          set({ user: employee, loading: false, authChecked: true })
        }
      } else if (event === 'SIGNED_OUT') {
        set({ user: null })
      } else if (event === 'USER_UPDATED') {
        // Re-fetch profile if user metadata changed
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          if (profile) {
            const employee = await profileToEmployee(profile)
            set({ user: employee })
          }
        }
      }
    })
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  },

  register: async (name, email, password, role, department, orgName, industry, size) => {
    // 1. Sign up with Supabase Auth — passes metadata that the DB trigger uses
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role, department },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (error) return { error: error.message }
    if (!data.user) return { error: 'Registration failed — no user returned' }

    // If email not confirmed yet (Supabase default), tell the UI
    const needsEmailConfirmation = !data.session

    // If session exists (email confirmation disabled in Supabase dashboard for dev)
    if (data.session && data.user) {
      // Update profile with full role / department
      await supabase
        .from('profiles')
        .update({ name, role, department })
        .eq('id', data.user.id)

      if (role === 'admin' && orgName) {
        // Create the organization
        const { data: org } = await supabase
          .from('organizations')
          .insert({
            name: orgName,
            industry: industry ?? 'Technology',
            size: size ?? '10-50 employees',
            admin_id: data.user.id,
            admin_name: name,
          })
          .select()
          .single()

        if (org) {
          // Link the admin to their org
          await supabase
            .from('profiles')
            .update({
              org_id: org.id,
              org_name: orgName,
              org_status: 'joined',
            })
            .eq('id', data.user.id)

          // Seed default cycle policy and check-in periods for the new org
          await seedOrgDefaults(org.id)

          // Audit
          await supabase.from('audit_log').insert({
            org_id: org.id,
            actor_id: data.user.id,
            actor_name: name,
            action: 'ORGANIZATION_CREATED',
            target_id: org.id,
            target_label: orgName,
            old_value: '',
            new_value: 'created',
          })
        }
      }
    }

    return { error: null, needsEmailConfirmation }
  },

  logout: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

// Seeds default cycle policy + check-in periods for a brand-new organization
async function seedOrgDefaults(orgId: string) {
  // 1. Cycle policy
  await supabase.from('cycle_policy').insert({
    org_id: orgId,
    max_goals: 8,
    min_goals: 3,
    min_weightage_per_goal: 10,
    total_weightage_required: 100,
    checkins_mandatory: true,
    goal_setting_mandatory: true,
    allow_late_submissions: false,
    late_submission_grace_days: 5,
  })

  // 2. Five check-in periods
  const periods = [
    {
      quarter: 'goal_setting',
      name: 'Goal Setting',
      label: 'Goal setting',
      action: 'Submit draft goals for manager approval',
      open_date: new Date('2026-05-01').toISOString(),
      close_date: new Date('2026-05-31').toISOString(),
    },
    {
      quarter: 'Q1',
      name: 'Q1 Check-in',
      label: 'Q1 Check-in',
      action: 'Log Q1 achievement & submit review comment',
      open_date: new Date('2026-07-01').toISOString(),
      close_date: new Date('2026-07-31').toISOString(),
    },
    {
      quarter: 'Q2',
      name: 'Q2 Check-in',
      label: 'Q2 Check-in',
      action: 'Log Q2 achievement & submit review comment',
      open_date: new Date('2026-10-01').toISOString(),
      close_date: new Date('2026-10-31').toISOString(),
    },
    {
      quarter: 'Q3',
      name: 'Q3 Check-in',
      label: 'Q3 Check-in',
      action: 'Log Q3 achievement & submit review comment',
      open_date: new Date('2027-01-01').toISOString(),
      close_date: new Date('2027-01-31').toISOString(),
    },
    {
      quarter: 'Q4',
      name: 'Q4 Check-in',
      label: 'Q4 Check-in',
      action: 'Log Q4 achievement & submit review comment',
      open_date: new Date('2027-03-01').toISOString(),
      close_date: new Date('2027-04-30').toISOString(),
    },
  ]

  await supabase.from('check_in_periods').insert(
    periods.map((p) => ({ ...p, org_id: orgId, enforced: true }))
  )
}
