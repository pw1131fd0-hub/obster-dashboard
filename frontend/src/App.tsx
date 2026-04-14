import { DashboardProvider } from './context/DashboardContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorBanner } from './components/ErrorBanner';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';
import { useDashboard } from './context/DashboardContext';

function DashboardContent() {
  const { state } = useDashboard();

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <Header />

      <main className="flex-1 p-6">
        <ErrorBanner />

        {state.loading && state.projects.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-text-muted">Loading...</div>
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

      <Footer />
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