import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { LogEntry } from '../types';

function LogEntryCard({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-primary rounded-lg p-4 border border-slate-700">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div>
          <h3 className="font-medium text-text">{log.filename}</h3>
          <p className="text-sm text-text-muted">{log.path}</p>
          <p className="text-xs text-text-muted mt-1">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
        <span className="text-text-muted">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      {expanded && (
        <div className="mt-3 bg-secondary rounded p-3 overflow-x-auto">
          <pre className="font-mono text-xs text-text whitespace-pre-wrap">
            {typeof log.content === 'string'
              ? log.content
              : JSON.stringify(log.content, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function ExecutionLogPanel() {
  const { state } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">執行日誌</h2>
      {state.logs.length === 0 ? (
        <p className="text-text-muted">暂无日誌資料</p>
      ) : (
        <div className="space-y-4">
          {state.logs.map((log, index) => (
            <LogEntryCard key={index} log={log} />
          ))}
        </div>
      )}
    </section>
  );
}
