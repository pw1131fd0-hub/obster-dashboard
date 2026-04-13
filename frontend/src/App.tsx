import React, { useState, useEffect } from 'react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import { ProjectStatusPanel } from './components/ProjectStatusPanel';
import { CronJobPanel } from './components/CronJobPanel';
import { AgentHealthPanel } from './components/AgentHealthPanel';
import { ExecutionLogPanel } from './components/ExecutionLogPanel';

const REFRESH_INTERVAL = 30;

function DashboardContent() {
  const { loading, error, lastUpdated, refresh } = useDashboard();
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCountdown(REFRESH_INTERVAL);
  }, [lastUpdated]);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--:--:--';
    return new Date(iso).toLocaleTimeString('zh-TW');
  };

  return (
    <div className="min-h-screen bg-primary text-text flex flex-col">
      <header className="bg-secondary border-b border-slate-700 px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-accent">OpenClaw Dashboard</h1>
            <p className="text-text-muted text-sm">小龍蝦系統監控儀表板</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:opacity-50 rounded text-white font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {loading ? '重新整理中...' : '重新整理'}
            </button>
            <div className="text-sm text-text-muted">
              <span className="hidden lg:inline">最後更新: </span>
              {formatTime(lastUpdated)}
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span className="text-sm text-text-muted">
            每 {REFRESH_INTERVAL} 秒自動刷新
            <span className="ml-2 text-accent">{countdown}s</span>
          </span>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="bg-error/20 border border-error text-error px-6 py-4 flex items-center justify-between"
        >
          <span>{error}</span>
          <button
            onClick={refresh}
            className="px-3 py-1 bg-error hover:bg-red-600 rounded text-white text-sm"
          >
            重試
          </button>
        </div>
      )}

      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProjectStatusPanel />
          <CronJobPanel />
          <AgentHealthPanel />
          <ExecutionLogPanel />
        </div>
      </main>

      <footer className="bg-secondary border-t border-slate-700 px-6 py-4 text-center text-text-muted text-sm">
        OpenClaw Dashboard v1.0.0 | Docker Container
      </footer>
    </div>
  );
}

export function App() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
