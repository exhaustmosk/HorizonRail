import type {
  AuditEntry,
  CheckInPeriod,
  CycleChangeRequest,
  CycleQuotaPolicy,
  Employee,
  Goal,
} from '../types'
import { PHASE_TABLE } from './checkInSchedule'

const q1 = (
  actual: number,
  status: Goal['quarterlyActuals'][0]['status'],
  planned?: number,
) => ({
  quarter: 'Q1' as const,
  planned: planned ?? actual,
  actual,
  status,
  submittedAt: new Date('2025-06-15'),
})

function makeGoal(
  partial: Omit<Goal, 'createdAt' | 'updatedAt' | 'quarterlyActuals'> & {
    q1Actual?: number
    q1Status?: Goal['quarterlyActuals'][0]['status']
  },
): Goal {
  const { q1Actual = 0, q1Status = 'on_track', ...rest } = partial
  return {
    ...rest,
    quarterlyActuals: q1Actual > 0 || partial.uom === 'zero' ? [q1(q1Actual, q1Status)] : [],
    createdAt: new Date('2025-04-01'),
    updatedAt: new Date('2025-06-01'),
  }
}

const rameshGoals: Goal[] = []

const priyaGoals: Goal[] = [
  makeGoal({
    id: 'g-p1',
    employeeId: 'emp-priya',
    thrustArea: 'Revenue Growth',
    title: 'Increase ARR by 15%',
    description: 'Annual recurring revenue target',
    uom: 'numeric_min',
    target: 15,
    weightage: 30,
    isAdminPushed: false,
    approvalStatus: 'approved',
    locked: true,
    q1Actual: 12,
    q1Status: 'on_track',
  }),
  makeGoal({
    id: 'g-p2',
    employeeId: 'emp-priya',
    thrustArea: 'Customer Experience',
    title: 'NPS Score ≥ 72',
    description: 'Net promoter score',
    uom: 'numeric_min',
    target: 72,
    weightage: 25,
    isAdminPushed: false,
    approvalStatus: 'approved',
    locked: true,
    q1Actual: 68,
    q1Status: 'on_track',
  }),
  makeGoal({
    id: 'g-p3',
    employeeId: 'emp-priya',
    thrustArea: 'Operational Excellence',
    title: 'Reduce churn to 2%',
    description: 'Customer churn rate',
    uom: 'numeric_max',
    target: 2,
    weightage: 25,
    isAdminPushed: true,
    approvalStatus: 'approved',
    locked: true,
    q1Actual: 2.4,
    q1Status: 'at_risk',
  }),
  makeGoal({
    id: 'g-p4',
    employeeId: 'emp-priya',
    thrustArea: 'Innovation',
    title: 'Launch 2 product features',
    description: 'Major feature releases',
    uom: 'numeric_min',
    target: 2,
    weightage: 20,
    isAdminPushed: false,
    approvalStatus: 'approved',
    locked: true,
    q1Actual: 1,
    q1Status: 'on_track',
  }),
]

function employeeGoals(
  empId: string,
  base: number,
  approval: Goal['approvalStatus'] = 'approved',
  locked = true,
): Goal[] {
  return [
    makeGoal({
      id: `g-${empId}-1`,
      employeeId: empId,
      thrustArea: 'Revenue Growth',
      title: `Revenue target Q${base}`,
      description: 'Quarterly revenue',
      uom: 'numeric_min',
      target: 100 + base * 10,
      weightage: 35,
      isAdminPushed: false,
      approvalStatus: approval,
      locked,
      q1Actual: 85 + base * 5,
      q1Status: 'on_track',
    }),
    makeGoal({
      id: `g-${empId}-2`,
      employeeId: empId,
      thrustArea: 'Operational Excellence',
      title: 'TAT reduction',
      description: 'Turnaround time days',
      uom: 'numeric_max',
      target: 5,
      weightage: 35,
      isAdminPushed: false,
      approvalStatus: approval,
      locked,
      q1Actual: 4.2,
      q1Status: 'on_track',
    }),
    makeGoal({
      id: `g-${empId}-3`,
      employeeId: empId,
      thrustArea: 'Risk & Compliance',
      title: 'Zero audit findings',
      description: 'Compliance incidents',
      uom: 'zero',
      target: 0,
      weightage: 30,
      isAdminPushed: empId === 'emp-raj',
      approvalStatus: approval,
      locked,
      q1Actual: empId === 'emp-raj' ? 0 : 1,
      q1Status: empId === 'emp-raj' ? 'completed' : 'at_risk',
    }),
  ]
}

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'mgr-ramesh',
    name: 'Ramesh Kumar',
    initials: 'RK',
    email: 'ramesh@acme.com',
    role: 'manager',
    department: 'Sales',
    goals: rameshGoals,
  },
  {
    id: 'emp-priya',
    name: 'Priya Sharma',
    initials: 'PS',
    email: 'priya@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Sales',
    goals: priyaGoals,
  },
  {
    id: 'emp-amit',
    name: 'Amit Patel',
    initials: 'AP',
    email: 'amit@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Sales',
    goals: employeeGoals('emp-amit', 1, 'submitted', false),
  },
  {
    id: 'emp-sneha',
    name: 'Sneha Reddy',
    initials: 'SR',
    email: 'sneha@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Marketing',
    goals: employeeGoals('emp-sneha', 2),
  },
  {
    id: 'emp-vikram',
    name: 'Vikram Singh',
    initials: 'VS',
    email: 'vikram@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Sales',
    goals: employeeGoals('emp-vikram', 3),
  },
  {
    id: 'emp-anita',
    name: 'Anita Desai',
    initials: 'AD',
    email: 'anita@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Operations',
    goals: employeeGoals('emp-anita', 4),
  },
  {
    id: 'emp-raj',
    name: 'Raj Mehta',
    initials: 'RM',
    email: 'raj@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Finance',
    goals: employeeGoals('emp-raj', 5),
  },
  {
    id: 'emp-kavita',
    name: 'Kavita Nair',
    initials: 'KN',
    email: 'kavita@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'HR',
    goals: employeeGoals('emp-kavita', 6, 'rejected', false),
  },
  {
    id: 'emp-rohan',
    name: 'Rohan Iyer',
    initials: 'RI',
    email: 'rohan@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Engineering',
    goals: employeeGoals('emp-rohan', 7),
  },
  {
    id: 'emp-meera',
    name: 'Meera Joshi',
    initials: 'MJ',
    email: 'meera@acme.com',
    role: 'employee',
    managerId: 'mgr-ramesh',
    department: 'Engineering',
    goals: employeeGoals('emp-meera', 8),
  },
  {
    id: 'mgr-leena',
    name: 'Leena Kapoor',
    initials: 'LK',
    email: 'leena@acme.com',
    role: 'manager',
    department: 'Engineering',
    goals: [],
  },
  {
    id: 'emp-arjun',
    name: 'Arjun Nambiar',
    initials: 'AN',
    email: 'arjun@acme.com',
    role: 'employee',
    managerId: 'mgr-leena',
    department: 'Engineering',
    goals: employeeGoals('emp-arjun', 9),
  },
  {
    id: 'emp-pooja',
    name: 'Pooja Menon',
    initials: 'PM',
    email: 'pooja@acme.com',
    role: 'employee',
    managerId: 'mgr-leena',
    department: 'Engineering',
    goals: employeeGoals('emp-pooja', 10),
  },
  {
    id: 'adm-divya',
    name: 'Divya Rao',
    initials: 'DR',
    email: 'divya@acme.com',
    role: 'admin',
    department: 'HR',
    goals: [],
  },
]

function periodDates(month: number, dayStart: number, closeMonth?: number, closeDay?: number) {
  const year = month >= 5 ? 2026 : 2027
  const closeYear = (closeMonth ?? month) >= 5 ? 2026 : 2027
  return {
    openDate: new Date(year, month - 1, dayStart),
    closeDate: new Date(
      closeYear,
      (closeMonth ?? month) - 1,
      closeDay ?? new Date(closeYear, month, 0).getDate(),
    ),
  }
}

export const MOCK_CHECK_IN_PERIODS: CheckInPeriod[] = PHASE_TABLE.map((phase) => {
  const dates =
    phase.id === 'goal_setting'
      ? periodDates(5, 1, 5, 31)
      : phase.id === 'Q1'
        ? periodDates(7, 1, 7, 31)
        : phase.id === 'Q2'
          ? periodDates(10, 1, 10, 31)
          : phase.id === 'Q3'
            ? periodDates(1, 1, 1, 31)
            : periodDates(3, 1, 4, 30)

  return {
    name: phase.label,
    quarter: phase.id,
    label: phase.label,
    action: phase.action,
    ...dates,
    enforced: true,
  }
})

export const MOCK_CYCLE_POLICY: CycleQuotaPolicy = {
  maxGoals: 8,
  minGoals: 3,
  minWeightagePerGoal: 10,
  totalWeightageRequired: 100,
  checkInsMandatory: true,
  goalSettingMandatory: true,
  allowLateSubmissions: false,
  lateSubmissionGraceDays: 5,
}

export const MOCK_CHANGE_REQUESTS: CycleChangeRequest[] = [
  {
    id: 'cr-1',
    requestedById: 'mgr-ramesh',
    requestedByName: 'Ramesh Kumar',
    requestedAt: new Date('2026-05-10T11:20:00'),
    status: 'pending',
    reason:
      'Two team members were on extended leave during the goal-setting window. We need five extra days so they can submit and get approvals without penalty.',
    summary: 'Extend Phase 1 (Goal Setting) close date by 5 days',
    targetPeriod: 'goal_setting',
    periodPatch: {
      closeDate: new Date('2026-06-05'),
    },
  },
  {
    id: 'cr-2',
    requestedById: 'mgr-leena',
    requestedByName: 'Leena Das',
    requestedAt: new Date('2026-04-28T09:00:00'),
    status: 'approved',
    reason:
      'Engineering squad runs a release freeze in early July; shifting Q1 check-in by one week avoids conflicting with the cutover.',
    summary: 'Shift Q1 check-in window to open 7 July',
    targetPeriod: 'Q1',
    periodPatch: {
      openDate: new Date('2026-07-08'),
      closeDate: new Date('2026-08-07'),
    },
    reviewedById: 'adm-divya',
    reviewedByName: 'Divya Rao',
    reviewedAt: new Date('2026-04-29T15:30:00'),
    reviewNote: 'Approved — aligned with release calendar.',
  },
]

export const MOCK_AUDIT_LOG: AuditEntry[] = [
  {
    id: 'a1',
    timestamp: new Date('2025-06-10T09:00:00'),
    actorId: 'emp-priya',
    actorName: 'Priya Sharma',
    action: 'GOAL_SUBMITTED',
    targetId: 'g-p1',
    targetLabel: 'Increase ARR by 15%',
    oldValue: 'draft',
    newValue: 'submitted',
  },
  {
    id: 'a2',
    timestamp: new Date('2025-06-11T14:30:00'),
    actorId: 'mgr-ramesh',
    actorName: 'Ramesh Kumar',
    action: 'GOAL_APPROVED',
    targetId: 'g-p1',
    targetLabel: 'Increase ARR by 15%',
    oldValue: 'submitted',
    newValue: 'approved',
  },
  {
    id: 'a3',
    timestamp: new Date('2025-06-12T10:15:00'),
    actorId: 'adm-divya',
    actorName: 'Divya Rao',
    action: 'KPI_PUSHED',
    targetId: 'g-p3',
    targetLabel: 'Reduce churn to 2%',
    oldValue: '',
    newValue: 'created',
  },
  {
    id: 'a4',
    timestamp: new Date('2025-06-14T11:00:00'),
    actorId: 'emp-amit',
    actorName: 'Amit Patel',
    action: 'GOAL_SUBMITTED',
    targetId: 'g-emp-amit-1',
    targetLabel: 'Revenue target Q1',
    oldValue: 'draft',
    newValue: 'submitted',
  },
  {
    id: 'a5',
    timestamp: new Date('2025-06-15T16:45:00'),
    actorId: 'emp-priya',
    actorName: 'Priya Sharma',
    action: 'ACTUAL_LOGGED',
    targetId: 'g-p1',
    targetLabel: 'Q1 actual',
    oldValue: '0',
    newValue: '12',
  },
  {
    id: 'a6',
    timestamp: new Date('2025-06-16T09:30:00'),
    actorId: 'mgr-ramesh',
    actorName: 'Ramesh Kumar',
    action: 'COMMENT_ADDED',
    targetId: 'g-p2',
    targetLabel: 'NPS Score ≥ 72',
    oldValue: '',
    newValue: 'Strong progress, focus on enterprise segment.',
  },
  {
    id: 'a7',
    timestamp: new Date('2025-06-17T13:00:00'),
    actorId: 'mgr-ramesh',
    actorName: 'Ramesh Kumar',
    action: 'GOAL_REJECTED',
    targetId: 'g-emp-kavita-1',
    targetLabel: 'Revenue target Q6',
    oldValue: 'submitted',
    newValue: 'rejected',
  },
  {
    id: 'a8',
    timestamp: new Date('2025-06-18T08:00:00'),
    actorId: 'adm-divya',
    actorName: 'Divya Rao',
    action: 'CYCLE_UPDATED',
    targetId: 'Q1',
    targetLabel: 'Q1 Check-in',
    oldValue: 'inactive',
    newValue: 'active',
  },
  {
    id: 'a9',
    timestamp: new Date('2025-06-19T15:20:00'),
    actorId: 'emp-sneha',
    actorName: 'Sneha Reddy',
    action: 'ACTUAL_LOGGED',
    targetId: 'g-emp-sneha-1',
    targetLabel: 'Q1 actual',
    oldValue: '0',
    newValue: '95',
  },
  {
    id: 'a10',
    timestamp: new Date('2025-06-20T10:00:00'),
    actorId: 'adm-divya',
    actorName: 'Divya Rao',
    action: 'GOAL_UNLOCKED',
    targetId: 'g-emp-kavita-2',
    targetLabel: 'TAT reduction',
    oldValue: 'locked',
    newValue: 'unlocked',
  },
]
