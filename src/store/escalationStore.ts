import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { EscalationPolicy, EscalationLog } from '../types'
import { useOrgStore } from './orgStore'

interface EscalationStore {
  policies: EscalationPolicy[]
  logs: EscalationLog[]
  loading: boolean
  
  fetchData: (orgId: string) => Promise<void>
  addPolicy: (policy: Omit<EscalationPolicy, 'id' | 'createdAt'>) => Promise<void>
  updatePolicy: (id: string, updates: Partial<EscalationPolicy>) => Promise<void>
  deletePolicy: (id: string) => Promise<void>
  resolveEscalation: (id: string) => Promise<void>
}

export const useEscalationStore = create<EscalationStore>((set) => ({
  policies: [],
  logs: [],
  loading: false,

  fetchData: async (orgId: string) => {
    set({ loading: true })
    
    // Fetch policies
    const { data: policiesData } = await supabase
      .from('escalation_policies')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: true })

    // Fetch logs
    const { data: logsData } = await supabase
      .from('escalation_logs')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    const policies = (policiesData ?? []).map((p: any) => ({
      id: p.id,
      orgId: p.org_id,
      condition: p.condition,
      daysThreshold: p.days_threshold,
      escalateTo: p.escalate_to,
      enabled: p.enabled,
      createdAt: new Date(p.created_at),
    }))

    // Hydrate logs with references
    const employees = useOrgStore.getState().employees
    const logs = (logsData ?? []).map((l: any) => ({
      id: l.id,
      orgId: l.org_id,
      policyId: l.policy_id,
      employeeId: l.employee_id,
      status: l.status,
      resolvedAt: l.resolved_at ? new Date(l.resolved_at) : undefined,
      createdAt: new Date(l.created_at),
      policy: policies.find((p) => p.id === l.policy_id),
      employee: employees.find((e) => e.id === l.employee_id),
    }))

    set({ policies, logs, loading: false })
  },

  addPolicy: async (policy) => {
    const { data, error } = await supabase
      .from('escalation_policies')
      .insert({
        org_id: policy.orgId,
        condition: policy.condition,
        days_threshold: policy.daysThreshold,
        escalate_to: policy.escalateTo,
        enabled: policy.enabled,
      })
      .select()
      .single()

    if (!error && data) {
      const newPolicy: EscalationPolicy = {
        id: data.id,
        orgId: data.org_id,
        condition: data.condition,
        daysThreshold: data.days_threshold,
        escalateTo: data.escalate_to,
        enabled: data.enabled,
        createdAt: new Date(data.created_at),
      }
      set((state) => ({ policies: [...state.policies, newPolicy] }))
    }
  },

  updatePolicy: async (id, updates) => {
    const dbUpdates: any = {}
    if (updates.condition) dbUpdates.condition = updates.condition
    if (updates.daysThreshold !== undefined) dbUpdates.days_threshold = updates.daysThreshold
    if (updates.escalateTo) dbUpdates.escalate_to = updates.escalateTo
    if (updates.enabled !== undefined) dbUpdates.enabled = updates.enabled

    const { error } = await supabase
      .from('escalation_policies')
      .update(dbUpdates)
      .eq('id', id)

    if (!error) {
      set((state) => ({
        policies: state.policies.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      }))
    }
  },

  deletePolicy: async (id) => {
    const { error } = await supabase.from('escalation_policies').delete().eq('id', id)
    if (!error) {
      set((state) => ({
        policies: state.policies.filter((p) => p.id !== id),
      }))
    }
  },

  resolveEscalation: async (id) => {
    const resolvedAt = new Date().toISOString()
    const { error } = await supabase
      .from('escalation_logs')
      .update({ status: 'resolved', resolved_at: resolvedAt })
      .eq('id', id)

    if (!error) {
      set((state) => ({
        logs: state.logs.map((l) =>
          l.id === id ? { ...l, status: 'resolved', resolvedAt: new Date(resolvedAt) } : l
        ),
      }))
    }
  },
}))
