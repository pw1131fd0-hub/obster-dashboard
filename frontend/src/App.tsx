import { DashboardProvider, useDashboard } from './context/DashboardContext';

function DashboardHeader() {
  const { state, refresh } = useDashboard();

  return (
    <header className="bg-[#1E293B] border-b border-[#334155] px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC]">🦞 OpenClaw Dashboard</h1>
        <div className="flex items-center gap-4">
          {state.lastUpdated && (
            <span className="text-sm text-[#94A3B8]">
              Updated: {state.lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={state.loading}
            className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#475569] text-[#F8FAFC] rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 focus:ring-offset-[#1E293B]"
          >
            {state.loading ? 'Refreshing...' : 'Refetch'}
          </button>
        </div>
      </div>
      {state.loading && (
        <div className="mt-3 h-1 bg-[#0F172A] rounded overflow-hidden">
          <div className="h-full bg-[#3B82F6] animate-pulse w-full" />
        </div>
      )}
    </header>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="mx-6 mt-4 p-4 bg-[#EF4444]/20 border border-[#EF4444] rounded text-[#F8FAFC]"
    >
      <p className="font-medium">Error: {message}</p>
    </div>
  );
}

function DashboardGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 lg:p-6">
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <ProjectStatusPanel />
      </div>
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <CronJobPanel />
      </div>
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <AgentHealthPanel />
      </div>
      <div className="bg-[#1E293B] rounded-lg border border-[#334155] overflow-hidden">
        <ExecutionLogPanel />
      </div>
    </div>
  );
}

function DashboardFooter() {
  return (
    <footer className="bg-[#1E293B] border-t border-[#334155] px-6 py-4 text-center text-sm text-[#94A3B8]">
      OpenClaw Dashboard v1.0.0 | Docker Container
    </footer>
  );
}

function App() {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#0F172A] flex flex-col">
        <DashboardHeader />
        <ErrorBannerWrapper />
        <main className="flex-1">
          <DashboardGrid />
        </main>
        <DashboardFooter />
      </div>
    </DashboardProvider>
  );
}

function ErrorBannerWrapper() {
  const { error } = useDashboard();
  if (!error) return null;
  return <ErrorBanner message={error} />;
}

// Placeholder imports - actual components will be created separately
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

export default App;
