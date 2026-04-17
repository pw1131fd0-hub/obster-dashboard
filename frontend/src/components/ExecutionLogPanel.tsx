import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

export default function ExecutionLogPanel() {
  const { state } = useDashboard();
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const recentLogs = state.logs.slice(-20);

  return (
    <section className="bg-secondary rounded-lg p-4">
      <h2 className="text-text font-semibold mb-4">Execution Logs</h2>
      {recentLogs.length === 0 ? (
        <p className="text-text-muted">No logs available</p>
      ) : (
        <ul className="space-y-2">
          {recentLogs.map((log, idx) => (
            <li key={idx} className="border border-primary rounded">
              <div
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-primary/50"
                onClick={() => setExpandedLog(expandedLog === idx ? null : idx)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-text text-sm font-mono">{log.filename}</span>
                  <span className="text-text-muted text-xs">{log.timestamp}</span>
                </div>
                <span className="text-accent text-sm">
                  {expandedLog === idx ? 'Collapse' : 'Expand'}
                </span>
              </div>
              {expandedLog === idx && (
                <pre className="bg-primary p-3 text-text-muted text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(log.content, null, 2)}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
