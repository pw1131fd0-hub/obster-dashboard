import { useDashboard } from './context/DashboardContext';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

function formatTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const { loading, error, lastUpdated, fetchData } = useDashboard();

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <header className="bg-secondary border-b border-gray-700 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              OpenClaw Dashboard
            </h1>
            <p className="text-text-muted text-sm mt-1">小龍蝦系統監控儀表板</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-text-muted">Auto-refresh: 30s</span>
            </div>
            <div className="text-sm text-text-muted">
              Last: <span className="text-text">{formatTime(lastUpdated)}</span>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-gray-600 text-white rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-error/20 border border-error text-error px-6 py-3 mx-6 mt-4 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="px-3 py-1 bg-error hover:bg-red-600 text-white rounded text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      <main className="flex-1 px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
      </main>

      <footer className="bg-secondary border-t border-gray-700 px-6 py-3 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0
      </footer>
    </div>
  );
}
