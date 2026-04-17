import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function Header() {
  const { state, refresh } = useDashboard();

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--:--';
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <header className="bg-secondary px-6 py-4 flex items-center justify-between border-b border-primary">
      <div className="flex items-center gap-4">
        <h1 className="text-text text-xl font-bold">🦞 OpenClaw Dashboard</h1>
        <span className="text-text-muted text-sm hidden sm:inline">小龍蝦系統監控儀表板</span>
      </div>
      <div className="flex items-center gap-4">
        {state.lastUpdated && (
          <span className="text-text-muted text-sm">
            Last: {formatTime(state.lastUpdated)}
          </span>
        )}
        <button
          onClick={refresh}
          disabled={state.loading}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-secondary"
        >
          {state.loading ? 'Refreshing...' : '重新整理'}
        </button>
      </div>
    </header>
  );
}

function ErrorBanner() {
  const { state, refresh } = useDashboard();
  if (!state.error) return null;
  return (
    <div role="alert" className="bg-error/20 border border-error text-error px-4 py-3 flex items-center justify-between">
      <span>{state.error}</span>
      <button
        onClick={refresh}
        className="text-error underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-error rounded px-2"
      >
        重新整理
      </button>
    </div>
  );
}

function AutoRefreshIndicator() {
  return (
    <div className="bg-secondary px-6 py-2 flex items-center gap-2 text-text-muted text-sm border-b border-primary">
      <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
      <span>每 30 秒自動刷新</span>
    </div>
  );
}

function DashboardGrid() {
  return (
    <main className="flex-1 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProjectStatusPanel />
        <CronJobPanel />
        <AgentHealthPanel />
        <ExecutionLogPanel />
      </div>
    </main>
  );
}

function Footer() {
  return (
    <footer className="bg-secondary px-6 py-3 text-text-muted text-sm text-center border-t border-primary">
      OpenClaw Dashboard v1.0.0 | Docker Container
    </footer>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-primary text-text">
      <Header />
      <ErrorBanner />
      <AutoRefreshIndicator />
      <DashboardGrid />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  );
}
