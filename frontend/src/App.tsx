import { useDashboard } from './context/DashboardContext';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function App() {
  const { state, refresh } = useDashboard();

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <header className="bg-secondary border-b border-slate-700 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Obster Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">
              Last updated: {formatLastUpdated(state.lastUpdated)}
            </span>
            <button
              onClick={refresh}
              disabled={state.loading}
              className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              {state.loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      {state.error && (
        <div role="alert" className="bg-error/20 border border-error text-error px-6 py-3">
          <strong>Error:</strong> {state.error}
        </div>
      )}

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
      </main>

      <footer className="bg-secondary border-t border-slate-700 px-6 py-3">
        <div className="container mx-auto text-center text-sm text-text-muted">
          Obster Dashboard v1.0.0
        </div>
      </footer>
    </div>
  );
}

export default App;