import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { LogEntry } from '../types';

function LogCard({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-primary/60 rounded-lg mb-2 border border-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="
          w-full flex justify-between items-center p-3
          text-left hover:bg-white/5 transition-colors duration-150
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent
        "
      >
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold text-text truncate">{log.filename}</p>
          <p className="text-text-muted text-xs mt-0.5 tabular-nums">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-text-muted shrink-0 ml-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          viewBox="0 0 12 12"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M4.5 2L9 6l-4.5 4V2z" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/5 bg-black/30 p-3 overflow-x-auto">
          <pre className="text-xs font-mono text-text-muted whitespace-pre leading-5">
            {JSON.stringify(log.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ExecutionLogPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <span aria-hidden="true">📜</span>
        Execution Logs
      </h2>
      <p className="text-text-muted text-xs mb-4">
        Last 20 entries &mdash; click to expand JSON
      </p>

      {state.logs.length === 0 ? (
        <p className="text-text-muted text-sm">No execution logs found</p>
      ) : (
        <div className="max-h-[36rem] overflow-y-auto pr-1">
          {state.logs.map((log) => (
            <LogCard key={log.path} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
