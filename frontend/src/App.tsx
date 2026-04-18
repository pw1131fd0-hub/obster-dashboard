import { useEffect, useCallback } from 'react';
import { useDashboard } from './context/DashboardContext';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function App() {
  const { state, fetchData } = useDashboard();

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <header className="bg-secondary border-b border-slate-700 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">🦞 OpenClaw Dashboard</h1>
            <p className="text-sm text-text-muted">小龍蝦系統監控儀表板 | VPS: srv1318420</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-text-muted">
              每 30 秒自動刷新
            </span>
            <span className="text-sm text-text-muted">
              Last: {formatLastUpdated(state.lastUpdated)}
            </span>
            <button
              onClick={handleRefresh}
              disabled={state.loading}
              className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-slate-600 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent"
            >
              重新整理
            </button>
          </div>
        </div>
      </header>

      {state.error && (
        <div role="alert" className="bg-error/20 border border-error text-error px-6 py-3">
          <strong>Error:</strong> {state.error}
          <button
            onClick={handleRefresh}
            className="ml-4 underline hover:no-underline focus:outline-none"
          >
            重新整理
          </button>
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
          OpenClaw Dashboard v1.0.0 | Docker Container
        </div>
      </footer>
    </div>
  );
}

export default App;