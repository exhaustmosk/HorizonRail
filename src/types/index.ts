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

export interface QuarterlyActual {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  actual: number
  status: GoalStatus
  managerComment?: string
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
}

export interface OrgNode {
  employee: Employee
  directReports: Employee[]
}

export interface CheckInPeriod {
  name: string
  quarter: 'goal_setting' | 'Q1' | 'Q2' | 'Q3' | 'Q4'
  openDate: Date
  closeDate: Date
  isActive: boolean
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
