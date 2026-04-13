import { useDashboard } from '../context/DashboardContext';

export function ErrorBanner() {
  const { state, refresh, dispatch } = useDashboard();

  if (!state.error) return null;

  return (
    <div
      role="alert"
      className="
        mb-4 p-4 rounded-lg
        bg-error/10 border border-error/40
        flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3
      "
    >
      <div className="flex items-start gap-2">
        <span
          className="mt-0.5 w-5 h-5 flex-shrink-0 text-error"
          aria-hidden="true"
        >
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <p className="text-error font-medium text-sm">{state.error}</p>
      </div>

      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={refresh}
          className="
            px-3 py-1.5 text-sm font-medium rounded
            bg-error/20 text-error hover:bg-error/30
            transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error
          "
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
          aria-label="Dismiss error"
          className="
            px-3 py-1.5 text-sm font-medium rounded
            bg-white/5 text-text-muted hover:bg-white/10
            transition-colors duration-150
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-muted
          "
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
