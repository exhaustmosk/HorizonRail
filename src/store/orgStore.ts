import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { AuditEntry, CheckInPeriod, Employee, JoinRequest, Organization } from '../types'
import { useAuthStore } from './authStore'

interface OrgStore {
  employees: Employee[]
  organizations: Organization[]
  checkInPeriods: CheckInPeriod[]
  auditLog: AuditEntry[]
  loading: boolean

  // Fetch all data for the current user's org
  fetchAll: () => Promise<void>
  fetchOrganizations: () => Promise<void>
  fetchAuditLog: () => Promise<void>

  // Employee helpers
  getDirectReports: (managerId: string) => Employee[]
  getEmployeeById: (id: string) => Employee | undefined
  getEmployeeByEmail: (email: string) => Employee | undefined
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  setEmployees: (employees: Employee[]) => void

  // Audit log
  getAuditLog: () => AuditEntry[]
  addAuditEntry: (entry: Omit<AuditEntry, 'id'>) => Promise<void>

  // Check-in periods
  updateCheckInPeriod: (quarter: CheckInPeriod['quarter'], updates: Partial<CheckInPeriod>) => Promise<void>

  // Organization onboarding
  getOrganizations: () => Organization[]
  createOrganization: (name: string, adminId: string, adminName: string, industry?: string, size?: string) => Promise<string>
  requestToJoinOrganization: (orgId: string, emp: Employee) => Promise<void>
  cancelJoinRequest: (orgId: string, empId: string) => Promise<void>
  approveJoinRequest: (orgId: string, empId: string) => Promise<void>
  denyJoinRequest: (orgId: string, empId: string) => Promise<void>
}

// ─── Converters ─────────────────────────────────────────────────────────────

function dbProfileToEmployee(profile: Record<string, unknown>, goals: Record<string, unknown>[] = []): Employee {
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
    goals: goals.map((g) => ({
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
    })),
  }
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  employees: [],
  organizations: [],
  checkInPeriods: [],
  auditLog: [],
  loading: false,

  // ── Main data fetch ────────────────────────────────────────────────────────
  fetchAll: async () => {
    set({ loading: true })
    const user = useAuthStore.getState().user
    if (!user?.organizationId) {
      set({ loading: false })
      return
    }
    const orgId = user.organizationId

    try {
      // 1. All employees in the org with their goals, actuals, comments
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('org_id', orgId)

      if (!profiles) { set({ loading: false }); return }

      const { data: goals } = await supabase
        .from('goals')
        .select('*, quarterly_actuals(*), checkin_comments(*)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: true })

      const goalsByEmployee: Record<string, Record<string, unknown>[]> = {}
      for (const g of goals ?? []) {
        const key = g.employee_id as string
        if (!goalsByEmployee[key]) goalsByEmployee[key] = []
        goalsByEmployee[key].push(g as Record<string, unknown>)
      }

      const employees = profiles.map((p) =>
        dbProfileToEmployee(p as Record<string, unknown>, goalsByEmployee[p.id as string] ?? [])
      )

      // 2. Join requests for admin's org
      const joinReqs = await supabase
        .from('join_requests')
        .select('*')
        .eq('org_id', orgId)

      const joinRequests: JoinRequest[] = (joinReqs.data ?? []).map((jr) => ({
        employeeId: jr.employee_id as string,
        employeeName: jr.employee_name as string,
        employeeEmail: jr.employee_email as string,
        employeeRole: jr.employee_role as 'employee' | 'manager',
        department: jr.department as string,
        requestedAt: new Date(jr.requested_at as string).getTime(),
      }))

      // 3. The org record
      const { data: orgRow } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

      const organizations: Organization[] = orgRow
        ? [
            {
              id: orgRow.id as string,
              name: orgRow.name as string,
              industry: orgRow.industry as string | undefined,
              size: orgRow.size as string | undefined,
              adminId: orgRow.admin_id as string,
              adminName: orgRow.admin_name as string,
              joinRequests,
            },
          ]
        : []

      // 4. Check-in periods
      const { data: periods } = await supabase
        .from('check_in_periods')
        .select('*')
        .eq('org_id', orgId)

      const checkInPeriods: CheckInPeriod[] = (periods ?? []).map((p) => ({
        name: p.name as string,
        quarter: p.quarter as CheckInPeriod['quarter'],
        label: p.label as string,
        action: p.action as string,
        openDate: new Date(p.open_date as string),
        closeDate: new Date(p.close_date as string),
        enforced: Boolean(p.enforced),
      }))

      set({ employees, organizations, checkInPeriods, loading: false })
    } catch (e) {
      console.error('fetchAll error', e)
      set({ loading: false })
    }
  },

  fetchOrganizations: async () => {
    const { data } = await supabase.from('organizations').select('*').order('name')
    if (!data) return

    // Fetch join requests for each org visible to the current user
    const orgs: Organization[] = await Promise.all(
      data.map(async (o) => {
        const { data: jrs } = await supabase
          .from('join_requests')
          .select('*')
          .eq('org_id', o.id as string)

        const joinRequests: JoinRequest[] = (jrs ?? []).map((jr) => ({
          employeeId: jr.employee_id as string,
          employeeName: jr.employee_name as string,
          employeeEmail: jr.employee_email as string,
          employeeRole: jr.employee_role as 'employee' | 'manager',
          department: jr.department as string,
          requestedAt: new Date(jr.requested_at as string).getTime(),
        }))

        return {
          id: o.id as string,
          name: o.name as string,
          industry: o.industry as string | undefined,
          size: o.size as string | undefined,
          adminId: o.admin_id as string,
          adminName: o.admin_name as string,
          joinRequests,
        }
      })
    )

    set({ organizations: orgs })
  },

  fetchAuditLog: async () => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .eq('org_id', user.organizationId)
      .order('timestamp', { ascending: false })
      .limit(100)

    set({
      auditLog: (data ?? []).map((a) => ({
        id: a.id as string,
        timestamp: new Date(a.timestamp as string),
        actorId: a.actor_id as string,
        actorName: a.actor_name as string,
        action: a.action as string,
        targetId: a.target_id as string,
        targetLabel: a.target_label as string,
        oldValue: (a.old_value as string) ?? '',
        newValue: (a.new_value as string) ?? '',
      })),
    })
  },

  // ── Employee helpers ───────────────────────────────────────────────────────
  getDirectReports: (managerId) =>
    get().employees.filter(
      (e) => e.managerId === managerId && e.role === 'employee' && e.organizationStatus === 'joined',
    ),

  getEmployeeById: (id) => get().employees.find((e) => e.id === id),

  getEmployeeByEmail: (email) =>
    get().employees.find((e) => e.email.toLowerCase() === email.toLowerCase()),

  updateEmployee: (id, updates) =>
    set((s) => ({ employees: s.employees.map((e) => (e.id === id ? { ...e, ...updates } : e)) })),

  setEmployees: (employees) => set({ employees }),

  getAuditLog: () => get().auditLog,

  addAuditEntry: async (entry) => {
    const user = useAuthStore.getState().user
    const { data } = await supabase
      .from('audit_log')
      .insert({
        org_id: user?.organizationId ?? null,
        actor_id: entry.actorId,
        actor_name: entry.actorName,
        action: entry.action,
        target_id: entry.targetId,
        target_label: entry.targetLabel,
        old_value: entry.oldValue,
        new_value: entry.newValue,
      })
      .select()
      .single()

    if (data) {
      set((s) => ({
        auditLog: [
          {
            id: data.id as string,
            timestamp: new Date(data.timestamp as string),
            actorId: data.actor_id as string,
            actorName: data.actor_name as string,
            action: data.action as string,
            targetId: data.target_id as string,
            targetLabel: data.target_label as string,
            oldValue: (data.old_value as string) ?? '',
            newValue: (data.new_value as string) ?? '',
          },
          ...s.auditLog,
        ],
      }))
    }
  },

  updateCheckInPeriod: async (quarter, updates) => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const patch: Record<string, unknown> = {}
    if (updates.openDate) patch.open_date = updates.openDate.toISOString()
    if (updates.closeDate) patch.close_date = updates.closeDate.toISOString()
    if (updates.enforced !== undefined) patch.enforced = updates.enforced

    await supabase
      .from('check_in_periods')
      .update(patch)
      .eq('org_id', user.organizationId)
      .eq('quarter', quarter)

    set((s) => ({
      checkInPeriods: s.checkInPeriods.map((p) =>
        p.quarter === quarter ? { ...p, ...updates } : p,
      ),
    }))
  },

  // ── Organizations ──────────────────────────────────────────────────────────
  getOrganizations: () => get().organizations,

  createOrganization: async (name, adminId, adminName, industry, size) => {
    const { data } = await supabase
      .from('organizations')
      .insert({ name, industry, size, admin_id: adminId, admin_name: adminName })
      .select()
      .single()

    if (data) {
      const org: Organization = {
        id: data.id as string,
        name,
        industry,
        size,
        adminId,
        adminName,
        joinRequests: [],
      }
      set((s) => ({ organizations: [...s.organizations, org] }))
      return data.id as string
    }
    return ''
  },

  requestToJoinOrganization: async (orgId, emp) => {
    const orgName = get().organizations.find((o) => o.id === orgId)?.name ?? ''

    await supabase.from('join_requests').upsert({
      org_id: orgId,
      employee_id: emp.id,
      employee_name: emp.name,
      employee_email: emp.email,
      employee_role: emp.role,
      department: emp.department,
    })

    await supabase
      .from('profiles')
      .update({ org_id: orgId, org_name: orgName, org_status: 'pending' })
      .eq('id', emp.id)

    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === emp.id
          ? { ...e, organizationId: orgId, organizationName: orgName, organizationStatus: 'pending' }
          : e,
      ),
      organizations: s.organizations.map((o) =>
        o.id === orgId
          ? {
              ...o,
              joinRequests: [
                ...o.joinRequests.filter((r) => r.employeeId !== emp.id),
                {
                  employeeId: emp.id,
                  employeeName: emp.name,
                  employeeEmail: emp.email,
                  employeeRole: emp.role as 'employee' | 'manager',
                  department: emp.department,
                  requestedAt: Date.now(),
                },
              ],
            }
          : o,
      ),
    }))

    // Keep authStore in sync for the currently logged in user
    if (useAuthStore.getState().user?.id === emp.id) {
      useAuthStore.getState().setUser({
        ...useAuthStore.getState().user!,
        organizationId: orgId,
        organizationName: orgName,
        organizationStatus: 'pending'
      })
    }
  },

  cancelJoinRequest: async (orgId, empId) => {
    await supabase
      .from('join_requests')
      .delete()
      .eq('org_id', orgId)
      .eq('employee_id', empId)

    await supabase
      .from('profiles')
      .update({ org_id: null, org_name: null, org_status: 'none' })
      .eq('id', empId)

    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === empId
          ? { ...e, organizationId: undefined, organizationName: undefined, organizationStatus: 'none' }
          : e,
      ),
      organizations: s.organizations.map((o) =>
        o.id === orgId
          ? { ...o, joinRequests: o.joinRequests.filter((r) => r.employeeId !== empId) }
          : o,
      ),
    }))

    if (useAuthStore.getState().user?.id === empId) {
      useAuthStore.getState().setUser({
        ...useAuthStore.getState().user!,
        organizationId: undefined,
        organizationName: undefined,
        organizationStatus: 'none'
      })
    }
  },

  approveJoinRequest: async (orgId, empId) => {
    await supabase
      .from('join_requests')
      .delete()
      .eq('org_id', orgId)
      .eq('employee_id', empId)

    await supabase
      .from('profiles')
      .update({ org_status: 'joined' })
      .eq('id', empId)

    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === empId ? { ...e, organizationStatus: 'joined' } : e,
      ),
      organizations: s.organizations.map((o) =>
        o.id === orgId
          ? { ...o, joinRequests: o.joinRequests.filter((r) => r.employeeId !== empId) }
          : o,
      ),
    }))

    const user = useAuthStore.getState().user
    await supabase.from('audit_log').insert({
      org_id: orgId,
      actor_id: user?.id ?? 'system',
      actor_name: user?.name ?? 'Admin',
      action: 'JOIN_REQUEST_APPROVED',
      target_id: empId,
      target_label: get().employees.find((e) => e.id === empId)?.name ?? empId,
      old_value: 'pending',
      new_value: 'joined',
    })
  },

  denyJoinRequest: async (orgId, empId) => {
    await supabase
      .from('join_requests')
      .delete()
      .eq('org_id', orgId)
      .eq('employee_id', empId)

    await supabase
      .from('profiles')
      .update({ org_id: null, org_name: null, org_status: 'none' })
      .eq('id', empId)

    set((s) => ({
      employees: s.employees.map((e) =>
        e.id === empId
          ? { ...e, organizationId: undefined, organizationName: undefined, organizationStatus: 'none' }
          : e,
      ),
      organizations: s.organizations.map((o) =>
        o.id === orgId
          ? { ...o, joinRequests: o.joinRequests.filter((r) => r.employeeId !== empId) }
          : o,
      ),
    }))

    const user = useAuthStore.getState().user
    await supabase.from('audit_log').insert({
      org_id: orgId,
      actor_id: user?.id ?? 'system',
      actor_name: user?.name ?? 'Admin',
      action: 'JOIN_REQUEST_DENIED',
      target_id: empId,
      target_label: get().employees.find((e) => e.id === empId)?.name ?? empId,
      old_value: 'pending',
      new_value: 'none',
    })
  },
}))
