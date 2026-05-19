import { useAuthStore } from '../store/authStore'
import Topbar from '../components/layout/Topbar'
import QoqTrends from '../components/analytics/QoqTrends'
import GoalDistribution from '../components/analytics/GoalDistribution'
import ManagerEffectiveness from '../components/analytics/ManagerEffectiveness'

export default function Analysis() {
  const user = useAuthStore((s) => s.user)

  if (!user) return null

  const showManagerDash = user.role === 'admin' || user.role === 'manager'

  return (
    <>
      <Topbar title="Analysis & Insights" />
      <div className="flex w-full flex-col overflow-y-auto h-[calc(100vh-3.5rem)] pb-12">
        {/* Analytics Dashboards */}
        <div className="p-6 lg:p-8 space-y-8 max-w-[1400px] mx-auto w-full">
          <section>
            <h2 className="mb-4 text-xl font-heading font-bold text-white">Goal Distribution</h2>
            <GoalDistribution />
          </section>

          <section>
            <h2 className="mb-4 text-xl font-heading font-bold text-white">Performance Trends</h2>
            <QoqTrends />
          </section>

          {showManagerDash && (
            <section>
              <h2 className="mb-4 text-xl font-heading font-bold text-white">Leadership Effectiveness</h2>
              <ManagerEffectiveness />
            </section>
          )}
        </div>
      </div>
    </>
  )
}

