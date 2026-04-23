import { useCallback } from 'react';
import { useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

function App() {
  const { state, refresh } = useDashboard();

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <Header />
      {state.error && <ErrorBanner message={state.error} onRefresh={refresh} />}
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

export default App;