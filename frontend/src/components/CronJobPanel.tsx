import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function CronJobPanel() {
  const { state } = useDashboard();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const getStatusColor = (status: string, exitCode: number | null): string => {
    if (exitCode !== null && exitCode !== 0) return 'text-error';
    switch (status) {
      case 'active':
        return 'text-success';
      case 'inactive':
        return 'text-text-muted';
      case 'failed':
      case 'error':
      case 'timeout':
        return 'text-error';
      default:
        return 'text-text-muted';
    }
  };

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Cron Jobs</h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted">No cron jobs available</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job) => (
            <div key={job.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{job.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(job.status, job.exit_code)}>
                    {job.status}
                  </span>
                  {job.exit_code !== null && (
                    <span className={job.exit_code === 0 ? 'text-success' : 'text-error'}>
                      Exit: {job.exit_code}
                    </span>
                  )}
                </div>
              </div>
              {job.last_run && (
                <p className="text-sm text-text-muted mt-1">Last Run: {job.last_run}</p>
              )}
              {job.recent_logs.length > 0 && (
                <button
                  onClick={() => setExpandedJob(expandedJob === job.name ? null : job.name)}
                  className="text-sm text-accent hover:underline mt-2"
                >
                  {expandedJob === job.name ? 'Hide Logs' : 'Show Logs'}
                </button>
              )}
              {expandedJob === job.name && (
                <div className="mt-2 bg-primary rounded p-3 font-mono text-xs overflow-x-auto">
                  {job.recent_logs.slice(0, 5).map((log, i) => (
                    <div key={i} className="text-text-muted">{log}</div>
                  ))}
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