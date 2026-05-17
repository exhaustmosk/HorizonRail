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
export const PRODUCT_NAME = 'HorizonRail'
export const COMPANY_NAME = 'HorizonRail'
export const FISCAL_YEAR = 'FY 2025-26'
export const PRODUCT_TAGLINE = 'Goal setting, quarterly check-ins, and team clarity — on one rail.'

export const CHECK_IN_STATUS_OPTIONS = [
  { value: 'not_started' as const, label: 'Not Started' },
  { value: 'on_track' as const, label: 'On Track' },
  { value: 'completed' as const, label: 'Completed' },
] as const

export const DEMO_CREDENTIALS: Record<
  string,
  { password: string; email: string }
> = {
  'priya@acme.com': { password: 'pass', email: 'priya@acme.com' },
  'ramesh@acme.com': { password: 'pass', email: 'ramesh@acme.com' },
  'leena@acme.com': { password: 'pass', email: 'leena@acme.com' },
  'divya@acme.com': { password: 'pass', email: 'divya@acme.com' },
}
