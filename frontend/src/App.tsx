import { DashboardProvider } from './context/DashboardContext';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

function DashboardContent() {
  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <Header />
      <ErrorBanner />

      <main className="flex-1 px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
      </main>

      <footer className="bg-secondary border-t border-gray-700 px-6 py-3 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0 | Docker Container
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}