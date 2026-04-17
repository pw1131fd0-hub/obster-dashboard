import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

export function ExecutionLogPanel() {
  const { logs, loading } = useDashboard();
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (filename: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) {
        next.delete(filename);
      } else {
        next.add(filename);
      }
      return next;
    });
  };

  return (
    <section className="bg-secondary rounded-lg p-4 h-full shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-text">Execution Logs</h2>
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-text-muted">Loading...</div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-text-muted">
          No logs found
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.filename} className="border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-text text-sm">{log.filename}</h3>
                <button
                  onClick={() => toggleExpanded(log.filename)}
                  className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1"
                >
                  {expandedLogs.has(log.filename) ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <p className="text-sm text-text-muted">
                {new Date(log.timestamp).toLocaleString()}
              </p>
              {expandedLogs.has(log.filename) && (
                <div className="mt-2 bg-primary rounded p-2 overflow-x-auto">
                  <pre className="text-xs text-text font-mono whitespace-pre-wrap">
                    {JSON.stringify(log.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
