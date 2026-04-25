import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-success text-white',
  inactive: 'bg-slate-500 text-white',
  failed: 'bg-error text-white',
  error: 'bg-error text-white',
  timeout: 'bg-warning text-black',
};

function CronJobPanel() {
  const { state } = useDashboard();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <section className="panel">
      <h2 className="panel-title flex items-center gap-2">
        <span>&#x23F0;</span>
        <span>Cron Job Monitor</span>
      </h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-muted">No cron jobs available</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job) => (
            <div key={job.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{job.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[job.status] || 'bg-slate-500 text-white'}`}>
                  {job.status}
                </span>
              </div>
              {job.last_run && (
                <p className="text-sm text-muted mt-1">Last Run: {job.last_run}</p>
              )}
              {job.exit_code !== null && (
                <p className="text-sm mt-1">
                  Exit Code: <span className={job.exit_code === 0 ? 'text-success font-medium' : 'text-error font-medium'}>{job.exit_code}</span>
                </p>
              )}
              {job.recent_logs.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => setExpandedJob(expandedJob === job.name ? null : job.name)}
                    className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                  >
                    {expandedJob === job.name ? '&#9660; Hide Logs' : '&#9654; Show Logs'}
                  </button>
                  {expandedJob === job.name && (
                    <div className="mt-2 bg-primary rounded p-3 font-mono text-xs overflow-x-auto max-h-40">
                      {job.recent_logs.slice(0, 5).map((log, i) => (
                        <div key={i} className="text-muted whitespace-pre-wrap break-all">{log}</div>
                      ))}
                      {job.recent_logs.length > 5 && (
                        <div className="text-muted mt-1">... and {job.recent_logs.length - 5} more lines</div>
                      )}
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