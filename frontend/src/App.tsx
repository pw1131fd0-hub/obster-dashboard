import { useDashboard } from './context/DashboardContext';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

function formatTime(isoString: string | null): string {
  if (!isoString) return '--:--:--';
  return new Date(isoString).toLocaleTimeString();
}

export function App() {
  const { loading, error, refresh, lastUpdated } = useDashboard();

  return (
    <div className="min-h-screen bg-primary text-text p-4 lg:p-6">
      <header className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text">OpenClaw Dashboard</h1>
            <p className="text-text-muted text-sm">
              OpenClaw System Monitor | VPS: srv1318420
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
              </span>
              Auto-refresh every 30s
            </div>
            <span className="text-sm text-text-muted">Last: {formatTime(lastUpdated)}</span>
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-accent hover:bg-accent/80 disabled:bg-accent/50 text-white rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-error/20 border border-error rounded-lg text-error"
        >
          <div className="flex items-center justify-between">
            <p>{error}</p>
            <button
              onClick={refresh}
              className="px-3 py-1 bg-error hover:bg-error/80 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 focus:ring-offset-primary"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ProjectStatusPanel />
        <CronJobPanel />
        <AgentHealthPanel />
        <ExecutionLogPanel />
      </main>

      <footer className="mt-6 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0 | Docker Container
      </footer>
    </div>
  );
}
