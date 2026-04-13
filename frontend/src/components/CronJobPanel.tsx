import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-slate-500',
  failed: 'bg-accent',
  error: 'bg-error',
};

const statusLabels: Record<string, string> = {
  active: 'ACTIVE',
  inactive: 'INACTIVE',
  failed: 'FAILED',
  error: 'ERROR',
};

function CronJobPanel() {
  const { state } = useDashboard();
  const { cronjobs } = state;
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  const toggleExpand = (name: string) => {
    setExpandedJob((prev) => (prev === name ? null : name));
  };

  return (
    <section className="bg-secondary rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>⏰</span>
        <span>Cron Job 監控</span>
      </h2>

      {cronjobs.length === 0 ? (
        <p className="text-text-muted">暫無 Cron Job 資料</p>
      ) : (
        <div className="space-y-4">
          {cronjobs.map((job) => (
            <div key={job.name} className="bg-primary rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-lg">{job.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white ${statusColors[job.status] || 'bg-slate-600'}`}
                >
                  {statusLabels[job.status] || job.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Last Run: </span>
                  <span className="text-text">{job.last_run || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Exit Code: </span>
                  <span className={job.exit_code === 0 ? 'text-success' : job.exit_code ? 'text-error' : 'text-text-muted'}>
                    {job.exit_code ?? 'N/A'}
                  </span>
                </div>
              </div>

              {job.recent_logs && job.recent_logs.length > 0 && (
                <div className="mt-3">
                  <button
                    onClick={() => toggleExpand(job.name)}
                    className="text-sm text-accent hover:text-blue-400 transition-colors"
                  >
                    {expandedJob === job.name ? '▼ 隱藏日誌' : '▶ 顯示日誌'}
                  </button>

                  {expandedJob === job.name && (
                    <div className="mt-2 bg-primary rounded border border-slate-700 p-3 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-text-muted whitespace-pre-wrap">
                        {job.recent_logs.slice(0, 5).join('\n')}
                      </pre>
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
