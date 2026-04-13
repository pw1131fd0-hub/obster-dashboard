import { DashboardProvider } from './context/DashboardContext';
import { Header } from './components/Header';
import { ErrorBanner } from './components/ErrorBanner';
import { Footer } from './components/Footer';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

function DashboardContent() {
  return (
    <div className="min-h-screen bg-primary text-text p-4 sm:p-6">
      <Header />
      <ErrorBanner />

      <main>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
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
