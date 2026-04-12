import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

function DashboardContent() {
  const { state, refresh } = useDashboard();

  return (
    <div className="min-h-screen bg-primary p-4">
      {/* Header */}
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-text">🦞 OpenClaw Dashboard</h1>
          <p className="text-text-muted text-sm">
            小龍蝦系統監控儀表板 | VPS: srv1318420
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={refresh}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg font-medium transition-colors"
          >
            重新整理
          </button>
          <div className="text-right">
            <p className="text-text-muted text-xs">Last updated</p>
            <p className="text-sm font-mono">
              {state.lastRefresh ? new Date(state.lastRefresh).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {state.error && (
        <div className="mb-4 p-3 bg-error/20 border border-error/30 rounded-lg">
          <p className="text-error font-medium">⚠️ {state.error}</p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="mb-4 flex items-center text-text-muted text-sm">
        <span className="inline-block w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></span>
        每 30 秒自動刷新
      </div>

      {/* Four Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectStatusPanel />
        <CronJobPanel />
        <AgentHealthPanel />
        <ExecutionLogPanel />
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-text-muted text-xs">
        OpenClaw Dashboard v1.0.0 | 運行於 Docker Container
      </footer>
    </div>
  );
}

function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}

export default App;