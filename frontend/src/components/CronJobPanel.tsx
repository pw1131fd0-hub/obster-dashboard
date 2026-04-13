import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { CronJob } from '../types';

function getStatusConfig(status: string): { bg: string; text: string; dot: string } {
  const map: Record<string, { bg: string; text: string; dot: string }> = {
    active:       { bg: 'bg-success/10 border-success/30',  text: 'text-success',    dot: 'bg-success'    },
    inactive:     { bg: 'bg-error/10 border-error/30',      text: 'text-error',      dot: 'bg-error'      },
    failed:       { bg: 'bg-error/10 border-error/30',      text: 'text-error',      dot: 'bg-error'      },
    activating:   { bg: 'bg-warning/10 border-warning/30',  text: 'text-warning',    dot: 'bg-warning'    },
    deactivating: { bg: 'bg-warning/10 border-warning/30',  text: 'text-warning',    dot: 'bg-warning'    },
    timeout:      { bg: 'bg-warning/10 border-warning/30',  text: 'text-warning',    dot: 'bg-warning'    },
    error:        { bg: 'bg-error/10 border-error/30',      text: 'text-error',      dot: 'bg-error'      },
  };
  return map[status] ?? { bg: 'bg-white/5 border-white/10', text: 'text-text-muted', dot: 'bg-text-muted' };
}

function CronJobCard({ cronjob }: { cronjob: CronJob }) {
  const [logsOpen, setLogsOpen] = useState(false);
  const { bg, text, dot } = getStatusConfig(cronjob.status);
  const exitCodeOk = cronjob.exit_code === 0;

  return (
    <div className={`rounded-lg p-4 mb-3 border ${bg}`}>
      {/* Header row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${dot}`}
            aria-hidden="true"
          />
          <h3 className="font-semibold text-text">{cronjob.name}</h3>
        </div>
        <span className={`text-xs font-semibold uppercase tracking-wide ${text}`}>
          {cronjob.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div>
          <p className="text-text-muted text-xs mb-0.5">Last Run</p>
          <p className="font-medium text-text text-xs tabular-nums">
            {cronjob.last_run
              ? new Date(cronjob.last_run).toLocaleString()
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-0.5">Exit Code</p>
          <p
            className={`font-bold text-sm ${
              cronjob.exit_code === null
                ? 'text-text-muted'
                : exitCodeOk
                ? 'text-success'
                : 'text-error'
            }`}
          >
            {cronjob.exit_code ?? 'N/A'}
          </p>
        </div>
      </div>

      {/* Collapsible logs */}
      {cronjob.recent_logs.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setLogsOpen((o) => !o)}
            aria-expanded={logsOpen}
            className="
              flex items-center gap-1 text-xs text-text-muted hover:text-text
              transition-colors duration-150
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              rounded
            "
          >
            <svg
              className={`w-3 h-3 transition-transform ${logsOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 12 12"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M4.5 2L9 6l-4.5 4V2z" />
            </svg>
            Recent Logs ({cronjob.recent_logs.length})
          </button>

          {logsOpen && (
            <div className="mt-2 bg-primary rounded p-2 overflow-y-auto max-h-32">
              {cronjob.recent_logs.slice(0, 5).map((line, i) => (
                <p key={i} className="text-text-muted text-xs font-mono leading-5 whitespace-pre-wrap break-all">
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CronJobPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span aria-hidden="true">⏰</span>
        Cron Job Monitor
      </h2>

      {state.cronjobs.length === 0 ? (
        <p className="text-text-muted text-sm">No cronjobs configured</p>
      ) : (
        <div className="max-h-[36rem] overflow-y-auto pr-1">
          {state.cronjobs.map((cronjob) => (
            <CronJobCard key={cronjob.name} cronjob={cronjob} />
          ))}
        </div>
      )}
    </div>
  );
}
