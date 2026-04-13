import { useDashboard } from './context/DashboardContext';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function App() {
  const { state, refresh } = useDashboard();
  const { loading, error, lastUpdated } = state;

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-primary text-text">
      {/* Header */}
      <header className="bg-secondary border-b border-slate-700 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span>🦞</span>
              <span>OpenClaw Dashboard</span>
            </h1>
            <p className="text-text-muted text-sm mt-1">
              小龍蝦系統監控儀表板 | VPS: srv1318420
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refresh}
              className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary"
            >
              重新整理
            </button>
            <div className="flex items-center gap-4 text-sm text-text-muted">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span>每 30 秒自動刷新</span>
              </div>
              <span>Last: {formatTime(lastUpdated)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="bg-error/10 border border-error text-error px-6 py-4 flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={refresh}
            className="px-3 py-1 bg-error hover:bg-red-600 text-white rounded text-sm transition-colors"
          >
            重新整理
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {loading && state.projects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted">載入中...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProjectStatusPanel />
            <CronJobPanel />
            <AgentHealthPanel />
            <ExecutionLogPanel />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-secondary border-t border-slate-700 px-6 py-4 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0 | Docker Container
      </footer>
    </div>
  );
}

export default App;
