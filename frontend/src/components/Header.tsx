import { useDashboard } from '../context/DashboardContext';

export function Header() {
  const { refresh, lastUpdated } = useDashboard();

  return (
    <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text leading-tight">
          OpenClaw Dashboard
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Small-scale distributed system monitor | VPS: srv1318420
        </p>
        <div className="flex items-center mt-2 text-text-muted text-sm">
          <span
            className="inline-block w-2 h-2 bg-success rounded-full mr-2 animate-pulse"
            aria-hidden="true"
          />
          Auto-refresh every 30 seconds
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-text-muted text-xs uppercase tracking-wide">Last updated</p>
          <p className="text-text text-sm font-mono tabular-nums">
            {lastUpdated
              ? new Date(lastUpdated).toLocaleTimeString()
              : 'Never'}
          </p>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="
            px-4 py-2 bg-accent hover:bg-accent/80 active:bg-accent/60
            text-white font-medium rounded-lg
            transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          "
        >
          Refresh
        </button>
      </div>
    </header>
  );
}
