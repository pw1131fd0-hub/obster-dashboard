import React from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function Header() {
  const { state, refresh } = useDashboard();
  return (
    <header className="bg-secondary px-6 py-4 flex items-center justify-between border-b border-primary">
      <h1 className="text-text text-xl font-bold">Obster Dashboard</h1>
      <div className="flex items-center gap-4">
        {state.lastUpdated && (
          <span className="text-text-muted text-sm">
            Last updated: {new Date(state.lastUpdated).toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={refresh}
          disabled={state.loading}
          className="bg-accent hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
        >
          {state.loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}

function ErrorBanner() {
  const { state } = useDashboard();
  if (!state.error) return null;
  return (
    <div role="alert" className="bg-error/20 border border-error text-error px-4 py-3">
      {state.error}
    </div>
  );
}

function Footer() {
  return (
    <footer className="bg-secondary px-6 py-3 text-text-muted text-sm text-center border-t border-primary">
      Obster Dashboard
    </footer>
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

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col bg-primary text-text">
      <Header />
      <ErrorBanner />
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
