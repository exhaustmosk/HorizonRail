export const THRUST_AREAS = [
  'Revenue Growth',
  'Operational Excellence',
  'Customer Experience',
  'Innovation',
  'People & Culture',
  'Risk & Compliance',
] as const

export const MAX_GOALS = 8
export const MIN_WEIGHTAGE = 10
export const COMPANY_NAME = 'Acme Corp'
export const FISCAL_YEAR = 'FY 2025-26'

export const DEMO_CREDENTIALS: Record<
  string,
  { password: string; email: string }
> = {
  'priya@acme.com': { password: 'pass', email: 'priya@acme.com' },
  'ramesh@acme.com': { password: 'pass', email: 'ramesh@acme.com' },
  'divya@acme.com': { password: 'pass', email: 'divya@acme.com' },
}
