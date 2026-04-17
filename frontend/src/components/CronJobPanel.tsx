import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-gray-500',
  failed: 'bg-error',
  error: 'bg-error',
};

export default function CronJobPanel() {
  const { state } = useDashboard();
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  return (
    <section className="bg-secondary rounded-lg p-4">
      <h2 className="text-text font-semibold mb-4">Cron Jobs</h2>
      {state.cronJobs.length === 0 ? (
        <p className="text-text-muted">No cron jobs available</p>
      ) : (
        <ul className="space-y-3">
          {state.cronJobs.map((job) => (
            <li key={job.name} className="border border-primary rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${statusColors[job.status] || 'bg-gray-500'}`} />
                  <span className="text-text">{job.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {job.exit_code !== null && (
                    <span className={`text-sm ${job.exit_code === 0 ? 'text-success' : 'text-error'}`}>
                      Exit: {job.exit_code}
                    </span>
                  )}
                  {job.recent_logs.length > 0 && (
                    <button
                      onClick={() => setExpandedJob(expandedJob === job.name ? null : job.name)}
                      className="text-accent text-sm hover:underline"
                    >
                      {expandedJob === job.name ? 'Hide logs' : 'Show logs'}
                    </button>
                  )}
                </div>
              </div>
              {job.last_run && (
                <div className="mt-1 text-text-muted text-xs">
                  Last run: {new Date(job.last_run).toLocaleString()}
                </div>
              )}
              {expandedJob === job.name && job.recent_logs.length > 0 && (
                <div className="mt-3 bg-primary rounded p-2">
                  <pre className="text-text-muted text-xs whitespace-pre-wrap overflow-x-auto">
                    {job.recent_logs.slice(0, 5).join('\n')}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}