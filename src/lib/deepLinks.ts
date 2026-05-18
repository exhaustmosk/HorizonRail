// Deep-link URL generators for email & Teams notification CTAs
// All return absolute URLs suitable for embedding in emails/Teams cards

function baseUrl(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://horizonrail.app'
}

/** Employee's own goal sheet */
export function goalSheetLink(goalId?: string): string {
  const url = `${baseUrl()}/my-goals`
  return goalId ? `${url}?goal=${goalId}` : url
}

/** Manager's goal review page */
export function managerGoalSheetLink(): string {
  return `${baseUrl()}/manager/goals`
}

/** Check-in page, optionally targeting a quarter */
export function checkInLink(quarter?: string): string {
  const url = `${baseUrl()}/check-ins`
  return quarter ? `${url}?quarter=${quarter}` : url
}

/** Admin join requests tab */
export function joinRequestsLink(): string {
  return `${baseUrl()}/admin`
}

/** Dashboard link */
export function dashboardLink(): string {
  return `${baseUrl()}/dashboard`
}

/** Manager team overview */
export function managerTeamLink(): string {
  return `${baseUrl()}/manager`
}
