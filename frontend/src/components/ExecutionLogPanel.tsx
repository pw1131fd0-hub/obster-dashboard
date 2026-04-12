import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import type { LogEntry } from '../types';

function LogCard({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-secondary rounded-lg p-3 mb-2">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <h4 className="font-mono text-sm font-semibold">{log.filename}</h4>
          <p className="text-text-muted text-xs">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </div>
        <span className="text-text-muted">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="mt-2 bg-primary rounded p-2 text-xs font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(log.content, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export function ExecutionLogPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">📜</span> 執行 Log
        <span className="ml-2 text-xs text-text-muted">(最近 20 筆)</span>
      </h2>
      {state.logs.length === 0 ? (
        <p className="text-text-muted">No execution logs found</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {state.logs.map((log) => (
            <LogCard key={log.path} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}