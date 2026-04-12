import { useDashboard } from '../context/DashboardContext';
import type { CronJob } from '../types';

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { bg: string; text: string }> = {
    active: { bg: 'bg-success/20', text: 'text-success' },
    inactive: { bg: 'bg-error/20', text: 'text-error' },
    failed: { bg: 'bg-error/20', text: 'text-error' },
    activating: { bg: 'bg-warning/20', text: 'text-warning' },
    deactivating: { bg: 'bg-warning/20', text: 'text-warning' },
  };
  const config = statusConfig[status] || { bg: 'bg-gray-500/20', text: 'text-text-muted' };
  return { bg: config.bg, text: config.text };
}

function CronJobCard({ cronjob }: { cronjob: CronJob }) {
  const { bg, text } = getStatusBadge(cronjob.status);
  return (
    <div className="bg-secondary rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold">{cronjob.name}</h3>
        <span className={`px-2 py-1 rounded text-xs ${bg} ${text} font-medium`}>
          {cronjob.status.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
        <div>
          <span className="text-text-muted">Last Run</span>
          <p className="font-semibold text-sm">
            {cronjob.last_run ? new Date(cronjob.last_run).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Exit Code</span>
          <p className={`font-bold ${cronjob.exit_code === 0 ? 'text-success' : 'text-error'}`}>
            {cronjob.exit_code ?? 'N/A'}
          </p>
        </div>
      </div>
      {cronjob.recent_logs.length > 0 && (
        <div className="mt-2">
          <p className="text-text-muted text-xs mb-1">Recent Logs:</p>
          <div className="bg-primary rounded p-2 text-xs font-mono max-h-24 overflow-y-auto">
            {cronjob.recent_logs.slice(0, 5).map((log, i) => (
              <div key={i} className="text-text-muted">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CronJobPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">⏰</span> Cron Job 監控
      </h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted">No cronjobs configured</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {state.cronjobs.map((cronjob) => (
            <CronJobCard key={cronjob.name} cronjob={cronjob} />
          ))}
        </div>
      )}
    </div>
  );
}