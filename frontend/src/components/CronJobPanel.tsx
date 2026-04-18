import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { CronJob } from '../types';

const statusColors: Record<CronJob['status'], string> = {
  active: 'text-success',
  inactive: 'text-gray-400',
  failed: 'text-error',
  error: 'text-error',
  timeout: 'text-error',
};

function LogToggle({ logs }: { logs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayLogs = logs.slice(0, 5);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-text-muted hover:text-text transition-colors"
      >
        {expanded ? '▲ 隱藏日誌' : '▼ 顯示日誌'}
      </button>
      {expanded && (
        <div className="mt-2 bg-primary rounded p-2 font-mono text-xs overflow-x-auto">
          {displayLogs.map((log, i) => (
            <div key={i} className="text-text-muted whitespace-pre">{log}</div>
          ))}
          {logs.length > 5 && (
            <div className="text-text-muted mt-1">... and {logs.length - 5} more lines</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CronJobPanel() {
  const { state } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">Cron Job 監控</h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted">暂无 cron job 資料</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job, index) => (
            <div key={index} className="bg-primary rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-text">{job.name}</h3>
                <span className={`text-sm font-medium ${statusColors[job.status]}`}>
                  {job.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Last Run:</span>
                  <span className="ml-2 text-text">
                    {job.last_run ? new Date(job.last_run).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Exit Code:</span>
                  <span className={`ml-2 ${job.exit_code === 0 ? 'text-success' : 'text-error'}`}>
                    {job.exit_code ?? 'N/A'}
                  </span>
                </div>
              </div>
              {job.recent_logs.length > 0 && <LogToggle logs={job.recent_logs} />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
