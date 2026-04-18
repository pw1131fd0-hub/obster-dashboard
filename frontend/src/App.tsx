import { DashboardProvider } from './context/DashboardContext';
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';
import Footer from './components/Footer';

function DashboardContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 lg:p-6">
        <ErrorBanner />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
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
