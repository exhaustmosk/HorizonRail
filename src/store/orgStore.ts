import { create } from 'zustand'
import { MOCK_AUDIT_LOG, MOCK_CHECK_IN_PERIODS, MOCK_EMPLOYEES } from '../lib/mockData'
import type { AuditEntry, CheckInPeriod, Employee } from '../types'

interface OrgStore {
  employees: Employee[]
  checkInPeriods: CheckInPeriod[]
  auditLog: AuditEntry[]
  getDirectReports: (managerId: string) => Employee[]
  getEmployeeById: (id: string) => Employee | undefined
  getEmployeeByEmail: (email: string) => Employee | undefined
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  setEmployees: (employees: Employee[]) => void
  getAuditLog: () => AuditEntry[]
  addAuditEntry: (entry: Omit<AuditEntry, 'id'>) => void
  updateCheckInPeriod: (quarter: CheckInPeriod['quarter'], updates: Partial<CheckInPeriod>) => void
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  employees: MOCK_EMPLOYEES,
  checkInPeriods: MOCK_CHECK_IN_PERIODS,
  auditLog: MOCK_AUDIT_LOG,

  getDirectReports: (managerId) =>
    get().employees.filter(
      (e) => e.managerId === managerId && e.role === 'employee',
    ),

  getEmployeeById: (id) => get().employees.find((e) => e.id === id),

  getEmployeeByEmail: (email) =>
    get().employees.find((e) => e.email.toLowerCase() === email.toLowerCase()),

  updateEmployee: (id, updates) => {
    set((state) => ({
      employees: state.employees.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    }))
  },

  setEmployees: (employees) => set({ employees }),

  getAuditLog: () => get().auditLog,

  addAuditEntry: (entry) => {
    const id = `audit-${Date.now()}`
    set((state) => ({
      auditLog: [{ ...entry, id }, ...state.auditLog],
    }))
  },

  updateCheckInPeriod: (quarter, updates) => {
    set((state) => ({
      checkInPeriods: state.checkInPeriods.map((p) =>
        p.quarter === quarter ? { ...p, ...updates } : p,
      ),
    }))
  },
}))
