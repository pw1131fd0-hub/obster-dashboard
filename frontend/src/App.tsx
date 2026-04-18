import { useDashboard } from './context/DashboardContext'
import ProjectStatusPanel from './components/ProjectStatusPanel'
import CronJobPanel from './components/CronJobPanel'
import AgentHealthPanel from './components/AgentHealthPanel'
import ExecutionLogPanel from './components/ExecutionLogPanel'

export default function App() {
  const { state, refresh } = useDashboard()

  return (
    <div className="min-h-screen bg-primary text-text-main p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            🦞 OpenClaw Dashboard
          </h1>
          <p className="text-text-muted text-sm">小龍蝦系統監控儀表板 | VPS: srv1318420</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>● 每 30 秒自動刷新</span>
            {state.lastUpdated && <span>Last: {state.lastUpdated}</span>}
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
          >
            重新整理
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {state.error && (
        <div role="alert" className="mb-6 p-4 bg-error/20 border border-error rounded-lg text-error">
          <p>{state.error}</p>
          <button onClick={refresh} className="mt-2 text-sm underline hover:no-underline">
            重新整理
          </button>
        </div>
      )}

      {/* Four Panels Grid */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectStatusPanel />
        <CronJobPanel />
        <AgentHealthPanel />
        <ExecutionLogPanel />
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0 | Docker Container
      </footer>
    </div>
  )
}
