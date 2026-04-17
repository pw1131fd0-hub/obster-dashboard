import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-gray-500',
  failed: 'bg-error',
  error: 'bg-error',
};

export function CronJobPanel() {
  const { cronjobs, loading } = useDashboard();
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());

  const toggleExpanded = (name: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  return (
    <section className="bg-secondary rounded-lg p-4 h-full">
      <h2 className="text-lg font-semibold mb-4 text-text">Cron Job Monitor</h2>
      {loading && cronjobs.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-text-muted">Loading...</div>
        </div>
      ) : cronjobs.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-text-muted">
          No cron jobs found
        </div>
      ) : (
        <div className="space-y-3">
          {cronjobs.map((job) => (
            <div key={job.name} className="border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-text">{job.name}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-xs text-white ${
                      statusColors[job.status] || 'bg-gray-500'
                    }`}
                  >
                    {job.status}
                  </span>
                  {job.exit_code !== null && (
                    <span
                      className={`text-sm ${
                        job.exit_code === 0 ? 'text-success' : 'text-error'
                      }`}
                    >
                      Exit: {job.exit_code}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm text-text-muted">
                {job.last_run ? (
                  <p>Last run: {new Date(job.last_run).toLocaleString()}</p>
                ) : (
                  <p>Last run: N/A</p>
                )}
              </div>
              {job.recent_logs.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() => toggleExpanded(job.name)}
                    className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                  >
                    {expandedJobs.has(job.name) ? 'Hide logs' : 'Show logs'}
                  </button>
                  {expandedJobs.has(job.name) && (
                    <div className="mt-2 bg-primary rounded p-2 max-h-32 overflow-y-auto">
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
