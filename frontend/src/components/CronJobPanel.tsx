import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function CronJobPanel() {
  const { state } = useDashboard();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-success text-white';
      case 'inactive':
        return 'bg-slate-500 text-white';
      case 'failed':
      case 'error':
        return 'bg-error text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">⏰ Cron Job 監控</h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted">暂無 Cron Job 資料</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job) => (
            <div key={job.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{job.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              {job.last_run && (
                <p className="text-sm text-text-muted mt-1">Last Run: {job.last_run}</p>
              )}
              {job.exit_code !== null && (
                <p className="text-sm mt-1">
                  Exit Code: <span className={job.exit_code === 0 ? 'text-success' : 'text-error'}>{job.exit_code}</span>
                </p>
              )}
              {job.recent_logs.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.name ? null : job.name)}
                    className="text-sm text-accent hover:underline"
                  >
                    {expandedJob === job.name ? 'Hide Logs' : 'Show Logs'}
                  </button>
                  {expandedJob === job.name && (
                    <div className="mt-2 bg-primary rounded p-3 font-mono text-xs overflow-x-auto max-h-32">
                      {job.recent_logs.slice(0, 5).map((log, i) => (
                        <div key={i} className="text-text-muted">{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CronJobPanel;