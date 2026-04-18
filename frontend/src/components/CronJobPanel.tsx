import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-success';
    case 'inactive':
      return 'text-text-muted';
    case 'failed':
      return 'text-error';
    case 'error':
    case 'timeout':
      return 'text-error';
    default:
      return 'text-text-muted';
  }
}

function getExitCodeColor(exitCode: number | null): string {
  if (exitCode === null) return 'text-text-muted';
  return exitCode === 0 ? 'text-success' : 'text-error';
}

interface LogEntryProps {
  logs: string[];
}

function LogEntry({ logs }: LogEntryProps) {
  const [expanded, setExpanded] = useState(false);
  const maxLines = 5;
  const displayLogs = expanded ? logs : logs.slice(0, maxLines);
  const hasMore = logs.length > maxLines;

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-text-muted hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
      >
        {expanded ? '▲ Collapse' : '▼ Expand'} ({logs.length} lines)
      </button>
      {expanded && (
        <div className="mt-2 bg-primary rounded p-2 font-mono text-xs text-text overflow-x-auto whitespace-pre">
          {displayLogs.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CronJobPanel() {
  const { cronjobs, loading } = useDashboard();

  if (loading && cronjobs.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text mb-4">Cron Job Monitor</h2>
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-lg font-semibold text-text mb-4">Cron Job Monitor</h2>
      {cronjobs.length === 0 ? (
        <div className="text-text-muted">No cron jobs found</div>
      ) : (
        <div className="space-y-3">
          {cronjobs.map((job) => (
            <div key={job.name} className="border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">{job.name}</span>
                <span className={`font-medium ${getStatusColor(job.status)}`}>
                  {job.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-text-muted">Last Run:</span>
                  <div className="text-text">{job.last_run || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-text-muted">Exit Code:</span>
                  <div className={`font-mono ${getExitCodeColor(job.exit_code)}`}>
                    {job.exit_code ?? '—'}
                  </div>
                </div>
              </div>
              {job.recent_logs && job.recent_logs.length > 0 && (
                <LogEntry logs={job.recent_logs} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
