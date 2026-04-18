import { useDashboard } from '../context/DashboardContext';

export default function ErrorBanner() {
  const { state, refresh } = useDashboard();
  if (!state.error) return null;
  return (
    <div role="alert" className="mb-4 p-4 bg-error/20 border border-error rounded-lg flex items-center justify-between">
      <span className="text-error">{state.error}</span>
      <button onClick={refresh} className="px-3 py-1 bg-error text-white rounded hover:bg-red-600 transition-colors">
        重新整理
      </button>
    </div>
  );
}
