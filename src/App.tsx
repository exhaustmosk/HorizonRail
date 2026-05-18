import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { useOrgStore } from './store/orgStore'
import { useCycleStore } from './store/cycleStore'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MyGoals from './pages/MyGoals'
import ManagerView from './pages/ManagerView'
import AdminPanel from './pages/AdminPanel'
import Reports from './pages/Reports'
import AuditLog from './pages/AuditLog'
import Analysis from './pages/Analysis'
import Profile from './pages/Profile'
import CheckIns from './pages/CheckIns'
import Onboarding from './pages/Onboarding'
import SelectManager from './pages/SelectManager'
import ManagerGoalSheet from './pages/ManagerGoalSheet'
import Policy from './pages/legal/Policy'
import Terms from './pages/legal/Terms'
import AcceptableUse from './pages/legal/AcceptableUse'
import Cookies from './pages/legal/Cookies'
import { Loader2 } from 'lucide-react'

// Full-screen loading component for initial bootstrap
function InitialLoader() {
  return (
    <div className="fixed inset-0 bg-[#0b0914] flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full" />
        <Loader2 className="w-12 h-12 text-purple-400 animate-spin relative z-10" />
      </div>
      <p className="mt-6 text-gray-400 font-medium animate-pulse tracking-wide">
        Connecting to Database...
      </p>
    </div>
  )
}

export default function App() {
  const { initialize, loading: authLoading, authChecked, user } = useAuthStore()
  const { fetchAll, fetchOrganizations, fetchAuditLog, loading: orgLoading } = useOrgStore()
  const { fetchPolicy, fetchChangeRequests } = useCycleStore()

  // 1. Initialize Auth (Checks session via Supabase)
  useEffect(() => {
    initialize()
  }, [initialize])

  // 2. Fetch App Data once logged in
  useEffect(() => {
    if (authChecked && user) {
      fetchOrganizations()
      if (user.organizationId) {
        fetchAll()
        fetchAuditLog()
        fetchPolicy()
        fetchChangeRequests()
      }
    }
  }, [authChecked, user, fetchAll, fetchOrganizations, fetchAuditLog, fetchPolicy, fetchChangeRequests])

  // Show loading screen until auth is verified and critical data is loaded
  const showLoader = !authChecked || (authChecked && user && orgLoading)

  if (showLoader) {
    return <InitialLoader />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/policy" element={<Policy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/acceptable-use" element={<AcceptableUse />} />
        <Route path="/cookies" element={<Cookies />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/select-manager" element={<SelectManager />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-goals" element={<MyGoals />} />
            <Route path="/check-ins" element={<CheckIns />} />
            <Route path="/manager" element={<ManagerView />} />
            <Route path="/manager/goals" element={<ManagerGoalSheet />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
