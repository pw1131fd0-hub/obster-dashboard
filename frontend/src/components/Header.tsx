import { useDashboard } from '../context/DashboardContext';

function Header() {
  const { state, refresh } = useDashboard();

  return (
    <header className="bg-secondary border-b border-slate-700 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text flex items-center gap-2">
            🦞 OpenClaw Dashboard
          </h1>
          <p className="text-sm text-text-muted">
            小龍蝦系統監控儀表板 | VPS: srv1318420
          </p>
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
            disabled={state.loading}
            className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
          >
            {state.loading ? '載入中...' : '重新整理'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;