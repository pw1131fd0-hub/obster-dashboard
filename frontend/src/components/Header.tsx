import { useDashboard } from '../context/DashboardContext';

interface HeaderProps {
  onRefresh?: () => void;
}

function Header({ onRefresh }: HeaderProps) {
  const { state, fetchData } = useDashboard();
  const handleRefresh = onRefresh || fetchData;

  const formatLastUpdated = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <header className="bg-secondary border-b border-slate-700 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>&#x1F99E;</span>
            <span>OpenClaw Dashboard</span>
          </h1>
          <p className="text-sm text-muted">OpenClaw System Monitor | VPS: srv1318420</p>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-muted">
            Last: {formatLastUpdated(state.lastUpdated)}
          </span>
          <button
            onClick={() => void handleRefresh()}
            disabled={state.loading}
            className="px-4 py-2 bg-accent hover:bg-blue-600 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary"
          >
            {state.loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;