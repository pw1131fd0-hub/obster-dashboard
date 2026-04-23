import { useDashboard } from '../context/DashboardContext';

interface HeaderProps {
  onRefresh?: () => void;
}

function Header({ onRefresh }: HeaderProps) {
  const { state, refresh } = useDashboard();
  const handleRefresh = onRefresh || refresh;

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <header className="bg-secondary border-b border-slate-700 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>🦞</span>
            <span>OpenClaw Dashboard</span>
          </h1>
          <p className="text-sm text-text-muted">小龍蝦系統監控儀表板 | VPS: srv1318420</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-text-muted">每 30 秒自動刷新</span>
          </div>
          <span className="text-sm text-text-muted">
            Last: {formatLastUpdated(state.lastUpdated)}
          </span>
          <button
            onClick={() => handleRefresh()}
            disabled={state.loading}
            className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-slate-600 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          >
            {state.loading ? '刷新中...' : '重新整理'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;