interface ErrorBannerProps {
  message: string;
  onRefresh: () => void;
  onDismiss?: () => void;
}

function ErrorBanner({ message, onRefresh, onDismiss }: ErrorBannerProps) {
  return (
    <div role="alert" className="bg-error/20 border border-error text-error px-6 py-3 mx-4 mt-4 rounded-lg">
      <div className="container mx-auto flex items-center justify-between">
        <span><strong>Error:</strong> {message}</span>
        <div className="flex items-center gap-3">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-primary"
            >
              Dismiss
            </button>
          )}
          <button
            onClick={onRefresh}
            className="px-4 py-1 bg-error hover:bg-red-600 text-white rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-primary"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorBanner;