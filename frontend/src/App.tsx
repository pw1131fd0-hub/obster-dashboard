import { useEffect, useState } from 'react';
import { useDashboard } from './context/DashboardContext';
import Header from './components/Header';
import ErrorBanner from './components/ErrorBanner';
import Footer from './components/Footer';
import ProjectStatusPanel from './components/ProjectStatusPanel';
import CronJobPanel from './components/CronJobPanel';
import AgentHealthPanel from './components/AgentHealthPanel';
import ExecutionLogPanel from './components/ExecutionLogPanel';

const REFRESH_INTERVAL = 30;

function AutoRefreshIndicator() {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
      <span className="text-sm text-text-muted">
        每 {REFRESH_INTERVAL} 秒自動刷新
        <span className="ml-2 font-mono text-accent">{countdown}s</span>
      </span>
    </div>
  );
}

function DashboardContent() {
  const { state, refresh } = useDashboard();
  const [dismissedError, setDismissedError] = useState<string | null>(null);

  useEffect(() => {
    if (state.error) {
      setDismissedError(null);
    }
  }, [state.error]);

  const handleDismissError = () => {
    setDismissedError(state.error);
  };

  const displayError = state.error && state.error !== dismissedError;

  return (
    <>
      <Header />
      {displayError && state.error && (
        <ErrorBanner message={state.error} onRefresh={refresh} onDismiss={handleDismissError} />
      )}
      <div className="bg-secondary/50 px-4 py-2">
        <div className="container mx-auto">
          <AutoRefreshIndicator />
        </div>
      </div>
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <DashboardContent />
    </div>
  );
}

export default App;