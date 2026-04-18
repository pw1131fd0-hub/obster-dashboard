import { useDashboard } from '../context/DashboardContext';

export default function Header() {
  const { state, refresh } = useDashboard();
  return (
    <header className="bg-secondary border-b border-slate-700 px-4 lg:px-6 py-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-text flex items-center gap-2">
            🦞 OpenClaw Dashboard
          </h1>
          <p className="text-text-muted text-sm">小龍蝦系統監控儀表板 | VPS: srv1318420</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-text-muted">
            <span className="text-success">●</span> 每 30 秒自動刷新
            {state.lastUpdated && (
              <span className="ml-2">Last: {state.lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            重新整理
          </button>
        </div>
      </div>
    </header>
  );
}
