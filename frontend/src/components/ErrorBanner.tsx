interface ErrorBannerProps {
  message: string;
  onRefresh: () => void;
}

function ErrorBanner({ message, onRefresh }: ErrorBannerProps) {
  return (
    <div role="alert" className="bg-error/20 border border-error text-error px-6 py-3 mx-4 mt-4 rounded-lg">
      <div className="container mx-auto flex items-center justify-between">
        <span><strong>Error:</strong> {message}</span>
        <button
          onClick={onRefresh}
          className="px-4 py-1 bg-error hover:bg-red-600 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-primary"
        >
          重新整理
        </button>
      </div>
    </div>
  );
}

export default ErrorBanner;