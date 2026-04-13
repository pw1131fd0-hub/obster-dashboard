import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-success',
  inactive: 'bg-slate-500',
  failed: 'bg-error',
  error: 'bg-error',
  timeout: 'bg-warning',
};

export function CronJobPanel() {
  const { cronjobs } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">Cron Job 監控</h2>
      {cronjobs.length === 0 ? (
        <p className="text-text-muted">暫無 Cron Job 資料</p>
      ) : (
        <div className="space-y-4">
          {cronjobs.map((job) => (
            <div key={job.name} className="border border-slate-600 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{job.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded text-white ${statusColors[job.status] || 'bg-slate-500'}`}
                >
                  {job.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">上次執行: </span>
                  <span>{job.last_run ? new Date(job.last_run).toLocaleString('zh-TW') : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Exit Code: </span>
                  <span className={job.exit_code === 0 ? 'text-success' : job.exit_code ? 'text-error' : ''}>
                    {job.exit_code ?? 'N/A'}
                  </span>
                </div>
              </div>
              {job.recent_logs.length > 0 && (
                <LogCollapsible logs={job.recent_logs} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LogCollapsible({ logs }: { logs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayLogs = expanded ? logs : logs.slice(0, 5);

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-accent hover:text-blue-400"
      >
        {expanded ? '▲ 收合' : '▼ 展開'} 最近日誌
      </button>
      {expanded && (
        <pre className="mt-2 p-2 bg-primary rounded text-xs text-text-muted overflow-x-auto whitespace-pre-wrap">
          {displayLogs.join('\n')}
        </pre>
      )}
    </div>
  );
}
