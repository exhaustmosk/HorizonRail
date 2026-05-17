export type UoMType = 'numeric_min' | 'numeric_max' | 'timeline' | 'zero'

export type GoalStatus = 'not_started' | 'on_track' | 'completed' | 'at_risk'

export type ApprovalStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export interface Goal {
  id: string
  employeeId: string
  thrustArea: string
  title: string
  description: string
  uom: UoMType
  target: number
  targetDate?: Date
  weightage: number
  isAdminPushed: boolean
  approvalStatus: ApprovalStatus
  locked: boolean
  quarterlyActuals: QuarterlyActual[]
  createdAt: Date
  updatedAt: Date
}

export interface CheckInComment {
  summary: string
  strengths?: string
  blockers?: string
  nextSteps?: string
  managerId: string
  managerName: string
  submittedAt: Date
}

export interface QuarterlyActual {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  planned: number
  actual: number
  status: GoalStatus
  employeeNotes?: string
  managerComment?: string
  checkInComment?: CheckInComment
  submittedAt: Date
}

export interface Employee {
  id: string
  name: string
  initials: string
  email: string
  role: 'employee' | 'manager' | 'admin'
  managerId?: string
  department: string
  goals: Goal[]
  organizationId?: string
  organizationName?: string
  organizationStatus?: 'none' | 'pending' | 'joined'
}

export interface JoinRequest {
  employeeId: string
  employeeName: string
  employeeEmail: string
  employeeRole: 'employee' | 'manager'
  department: string
  requestedAt: number // Unix timestamp
}

export interface Organization {
  id: string
  name: string
  industry?: string
  size?: string
  adminId: string
  adminName: string
  joinRequests: JoinRequest[]
}

export interface OrgNode {
  employee: Employee
  directReports: Employee[]
}

export type CyclePhaseId = 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4'

export interface CheckInPeriod {
  name: string
  quarter: CyclePhaseId
  label: string
  action: string
  openDate: Date
  closeDate: Date
  /** @deprecated Computed from dates; kept for legacy saves */
  isActive?: boolean
  enforced: boolean
}

export interface CycleQuotaPolicy {
  maxGoals: number
  minGoals: number
  minWeightagePerGoal: number
  totalWeightageRequired: number
  checkInsMandatory: boolean
  goalSettingMandatory: boolean
  allowLateSubmissions: boolean
  lateSubmissionGraceDays: number
}

export type CycleChangeRequestStatus = 'pending' | 'approved' | 'rejected'

export interface CycleChangeRequest {
  id: string
  requestedById: string
  requestedByName: string
  requestedAt: Date
  status: CycleChangeRequestStatus
  reason: string
  /** Human-readable summary of what the manager wants changed */
  summary: string
  targetPeriod?: CyclePhaseId
  policyPatch?: Partial<CycleQuotaPolicy>
  periodPatch?: Partial<Pick<CheckInPeriod, 'openDate' | 'closeDate' | 'enforced'>>
  reviewedById?: string
  reviewedByName?: string
  reviewedAt?: Date
  reviewNote?: string
}

export interface QuarterlyProgressDraft {
  goalId: string
  planned: number
  actual: number
  narrative: string
}

export interface AuditEntry {
  id: string
  timestamp: Date
  actorId: string
  actorName: string
  action: string
  targetId: string
  targetLabel: string
  oldValue: string
  newValue: string
}
