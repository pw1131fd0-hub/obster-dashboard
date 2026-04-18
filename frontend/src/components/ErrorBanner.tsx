import { useDashboard } from '../context/DashboardContext';

function ErrorBanner({ message }: { message: string }) {
  const { refresh } = useDashboard();

  return (
    <div role="alert" className="bg-error/20 border border-error text-error px-4 py-3 mx-4 mt-4 rounded-lg">
      <div className="container mx-auto flex items-center justify-between">
        <span>{message}</span>
        <button
          onClick={refresh}
          className="px-3 py-1 bg-error hover:bg-red-600 rounded text-sm"
        >
          重新整理
        </button>
      </div>
    </div>
  );
}

export default ErrorBanner;