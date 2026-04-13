import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

export function ExecutionLogPanel() {
  const { logs } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">執行 Log</h2>
      {logs.length === 0 ? (
        <p className="text-text-muted">暫無執行日誌</p>
      ) : (
        <div className="space-y-3">
          {logs.slice(0, 20).map((log) => (
            <LogCard key={log.path} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

function LogCard({ log }: { log: { filename: string; timestamp: string; content: Record<string, unknown> } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-slate-600 rounded">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
      >
        <div>
          <span className="font-medium text-sm">{log.filename}</span>
          <span className="ml-3 text-text-muted text-xs">
            {new Date(log.timestamp).toLocaleString('zh-TW')}
          </span>
        </div>
        <span className="text-text-muted text-sm">
          {expanded ? '▲' : '▼'}
        </span>
      </button>
      {expanded && (
        <pre className="px-4 py-3 bg-primary text-xs text-text overflow-x-auto font-mono whitespace-pre-wrap border-t border-slate-600">
          {JSON.stringify(log.content, null, 2)}
        </pre>
      )}
    </div>
  );
}
