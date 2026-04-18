import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function CronJobPanel() {
  const { state } = useDashboard();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    active: 'text-success',
    inactive: 'text-text-muted',
    failed: 'text-error',
    error: 'text-error',
  };

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        ⏰ Cron Job 監控
      </h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted">暫無 Cron Job 資料</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job) => (
            <div key={job.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{job.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={statusColors[job.status] || 'text-text-muted'}>
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
              <button
                onClick={() => setExpandedJob(expandedJob === job.name ? null : job.name)}
                className="text-sm text-accent hover:underline mt-2"
              >
                {expandedJob === job.name ? '隱藏日誌' : '顯示日誌'}
              </button>
              {expandedJob === job.name && job.recent_logs.length > 0 && (
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