import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
