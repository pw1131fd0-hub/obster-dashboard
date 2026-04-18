import { useDashboard } from './context/DashboardContext'
import ProjectStatusPanel from './components/ProjectStatusPanel'
import CronJobPanel from './components/CronJobPanel'
import AgentHealthPanel from './components/AgentHealthPanel'
import ExecutionLogPanel from './components/ExecutionLogPanel'
import ErrorBanner from './components/ErrorBanner'
import Footer from './components/Footer'

export default function App() {
  const { state, refresh } = useDashboard()

  return (
    <div className="min-h-screen bg-primary text-text p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            🦞 OpenClaw Dashboard
          </h1>
          <p className="text-text-muted text-sm">小龍蝦系統監控儀表板 | VPS: srv1318420</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span className="text-success">●</span>
            <span>每 30 秒自動刷新</span>
            {state.lastUpdated && (
              <span className="ml-2">Last: {state.lastUpdated}</span>
            )}
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          >
            重新整理
          </button>
        </div>
      </header>

      {/* Error Banner */}
      <ErrorBanner />

      {/* Four Panels Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectStatusPanel />
        <CronJobPanel />
        <AgentHealthPanel />
        <ExecutionLogPanel />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}