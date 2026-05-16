import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const ROLE_ROUTES: Record<string, string[]> = {
  employee: ['/dashboard', '/my-goals', '/reports'],
  manager: ['/manager', '/reports'],
  admin: ['/admin', '/audit', '/reports'],
}

export default function ProtectedRoute() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
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
