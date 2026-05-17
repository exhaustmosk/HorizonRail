import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { CycleChangeRequest, CyclePhaseId, CycleQuotaPolicy } from '../types'
import { useOrgStore } from './orgStore'
import { useAuthStore } from './authStore'

interface CycleStore {
  policy: CycleQuotaPolicy
  changeRequests: CycleChangeRequest[]
  adminForcedPeriodId: CyclePhaseId | null

  fetchPolicy: () => Promise<void>
  fetchChangeRequests: () => Promise<void>
  updatePolicy: (patch: Partial<CycleQuotaPolicy>, silent?: boolean) => Promise<void>
  setAdminForcedPeriod: (id: CyclePhaseId | null) => void
  submitChangeRequest: (req: Omit<CycleChangeRequest, 'id' | 'requestedAt' | 'status' | 'reviewedAt'>) => Promise<void>
  reviewChangeRequest: (id: string, status: 'approved' | 'rejected', reviewNote: string) => Promise<void>
  applyApprovedRequest: (request: CycleChangeRequest) => Promise<void>
}

// Default fallback if org is brand new
const FALLBACK_POLICY: CycleQuotaPolicy = {
  maxGoals: 8,
  minGoals: 3,
  minWeightagePerGoal: 10,
  totalWeightageRequired: 100,
  checkInsMandatory: true,
  goalSettingMandatory: true,
  allowLateSubmissions: false,
  lateSubmissionGraceDays: 5,
}

export const useCycleStore = create<CycleStore>((set, get) => ({
  policy: FALLBACK_POLICY,
  changeRequests: [],
  adminForcedPeriodId: null,

  fetchPolicy: async () => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const { data } = await supabase
      .from('cycle_policy')
      .select('*')
      .eq('org_id', user.organizationId)
      .single()

    if (data) {
      set({
        policy: {
          maxGoals: Number(data.max_goals),
          minGoals: Number(data.min_goals),
          minWeightagePerGoal: Number(data.min_weightage_per_goal),
          totalWeightageRequired: Number(data.total_weightage_required),
          checkInsMandatory: Boolean(data.checkins_mandatory),
          goalSettingMandatory: Boolean(data.goal_setting_mandatory),
          allowLateSubmissions: Boolean(data.allow_late_submissions),
          lateSubmissionGraceDays: Number(data.late_submission_grace_days),
        },
      })
    }
  },

  fetchChangeRequests: async () => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const { data } = await supabase
      .from('change_requests')
      .select('*')
      .eq('org_id', user.organizationId)
      .order('requested_at', { ascending: false })

    if (data) {
      const changeRequests: CycleChangeRequest[] = data.map((cr) => ({
        id: cr.id as string,
        requestedById: cr.requested_by_id as string,
        requestedByName: cr.requested_by_name as string,
        requestedAt: new Date(cr.requested_at as string),
        status: cr.status as 'pending' | 'approved' | 'rejected',
        reason: cr.reason as string,
        summary: cr.summary as string,
        targetPeriod: (cr.target_period as CyclePhaseId) ?? undefined,
        policyPatch: (cr.policy_patch as Record<string, unknown>) ?? undefined,
        periodPatch: (cr.period_patch as Record<string, unknown>) ?? undefined,
        reviewedById: (cr.reviewed_by_id as string) ?? undefined,
        reviewedByName: (cr.reviewed_by_name as string) ?? undefined,
        reviewedAt: cr.reviewed_at ? new Date(cr.reviewed_at as string) : undefined,
        reviewNote: (cr.review_note as string) ?? undefined,
      }))
      set({ changeRequests })
    }
  },

  updatePolicy: async (patch, silent = false) => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const dbPatch: Record<string, unknown> = {}
    if (patch.maxGoals !== undefined) dbPatch.max_goals = patch.maxGoals
    if (patch.minGoals !== undefined) dbPatch.min_goals = patch.minGoals
    if (patch.minWeightagePerGoal !== undefined) dbPatch.min_weightage_per_goal = patch.minWeightagePerGoal
    if (patch.totalWeightageRequired !== undefined) dbPatch.total_weightage_required = patch.totalWeightageRequired
    if (patch.checkInsMandatory !== undefined) dbPatch.checkins_mandatory = patch.checkInsMandatory
    if (patch.goalSettingMandatory !== undefined) dbPatch.goal_setting_mandatory = patch.goalSettingMandatory
    if (patch.allowLateSubmissions !== undefined) dbPatch.allow_late_submissions = patch.allowLateSubmissions
    if (patch.lateSubmissionGraceDays !== undefined) dbPatch.late_submission_grace_days = patch.lateSubmissionGraceDays

    await supabase
      .from('cycle_policy')
      .update(dbPatch)
      .eq('org_id', user.organizationId)

    set((state) => ({ policy: { ...state.policy, ...patch } }))

    if (!silent) {
      await useOrgStore.getState().addAuditEntry({
        timestamp: new Date(),
        actorId: user.id,
        actorName: user.name,
        action: 'CYCLE_POLICY_UPDATED',
        targetId: 'cycle-policy',
        targetLabel: 'Cycle quota policy',
        oldValue: '',
        newValue: JSON.stringify(patch),
      })
    }
  },

  setAdminForcedPeriod: (id) => set({ adminForcedPeriodId: id }),

  submitChangeRequest: async (req) => {
    const user = useAuthStore.getState().user
    if (!user?.organizationId) return

    const { data } = await supabase
      .from('change_requests')
      .insert({
        org_id: user.organizationId,
        requested_by_id: req.requestedById,
        requested_by_name: req.requestedByName,
        status: 'pending',
        reason: req.reason,
        summary: req.summary,
        target_period: req.targetPeriod ?? null,
        policy_patch: req.policyPatch ?? null,
        period_patch: req.periodPatch ?? null,
      })
      .select()
      .single()

    if (data) {
      await get().fetchChangeRequests()
      await useOrgStore.getState().addAuditEntry({
        timestamp: new Date(),
        actorId: req.requestedById,
        actorName: req.requestedByName,
        action: 'CYCLE_CHANGE_REQUESTED',
        targetId: data.id as string,
        targetLabel: req.summary,
        oldValue: '',
        newValue: req.reason,
      })
    }
  },

  reviewChangeRequest: async (id, status, reviewNote) => {
    const user = useAuthStore.getState().user
    if (!user) return

    await supabase
      .from('change_requests')
      .update({
        status,
        review_note: reviewNote,
        reviewed_by_id: user.id,
        reviewed_by_name: user.name,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    const request = get().changeRequests.find((r) => r.id === id)
    if (request && status === 'approved') {
      await get().applyApprovedRequest({ ...request, status, reviewNote })
    }

    await get().fetchChangeRequests()

    await useOrgStore.getState().addAuditEntry({
      timestamp: new Date(),
      actorId: user.id,
      actorName: user.name,
      action: status === 'approved' ? 'CYCLE_REQUEST_APPROVED' : 'CYCLE_REQUEST_REJECTED',
      targetId: id,
      targetLabel: request?.summary ?? id,
      oldValue: 'pending',
      newValue: status,
    })
  },

  applyApprovedRequest: async (request) => {
    if (request.policyPatch) {
      await get().updatePolicy(request.policyPatch, true)
    }
    if (request.targetPeriod && request.periodPatch) {
      await useOrgStore.getState().updateCheckInPeriod(request.targetPeriod, request.periodPatch)
    }
  },
}))
