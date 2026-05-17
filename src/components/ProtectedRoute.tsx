import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ROLE_ROUTES: Record<string, string[]> = {
  employee: ['/dashboard', '/my-goals', '/reports', '/analysis', '/profile'],
  manager: ['/manager', '/reports', '/analysis', '/profile'],
  admin: ['/admin', '/audit', '/reports', '/analysis', '/profile'],
}

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const authChecked = useAuthStore((s) => s.authChecked)
  const location = useLocation()

  if (!authChecked) {
    return null // Let App.tsx loader handle this
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Guard onboarding status:
  if (user.organizationStatus !== 'joined') {
    if (location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />
    }
    return <Outlet />
  }

  // If already joined but trying to visit onboarding, redirect to home page
  if (location.pathname === '/onboarding') {
    const redirect =
      user.role === 'manager'
        ? '/manager'
        : user.role === 'admin'
          ? '/admin'
          : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  const allowed = ROLE_ROUTES[user.role] ?? []
  const path = location.pathname
  const isAllowed =
    allowed.some((r) => path.startsWith(r)) ||
    path === '/dashboard' ||
    path === '/my-goals'

  if (!isAllowed) {
    const redirect =
      user.role === 'manager'
        ? '/manager'
        : user.role === 'admin'
          ? '/admin'
          : '/dashboard'
    return <Navigate to={redirect} replace />
  }

  return <Outlet />
}
