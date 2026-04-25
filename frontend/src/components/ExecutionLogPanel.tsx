import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function ExecutionLogPanel() {
  const { state } = useDashboard();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  return (
    <section className="panel">
      <h2 className="panel-title flex items-center gap-2">
        <span>&#x1F4DC;</span>
        <span>Execution Logs</span>
      </h2>
      {state.logs.length === 0 ? (
        <p className="text-muted">No logs available</p>
      ) : (
        <div className="space-y-4">
          {state.logs.slice(0, 20).map((log) => (
            <div key={log.filename} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{log.filename}</h3>
                  <p className="text-sm text-muted">{log.timestamp}</p>
                </div>
                <button
                  onClick={() => setExpandedLog(expandedLog === log.filename ? null : log.filename)}
                  className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                >
                  {expandedLog === log.filename ? '&#9660; Hide' : '&#9654; Expand'}
                </button>
              </div>
              {expandedLog === log.filename && (
                <div className="mt-3 bg-primary rounded p-3 font-mono text-xs overflow-x-auto max-h-80">
                  <pre className="whitespace-pre-wrap break-all">
                    {JSON.stringify(log.content, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
          {state.logs.length > 0 && (
            <p className="text-sm text-muted">Total: {state.logs.length} logs</p>
          )}
        </div>
      )}
    </section>
  );
}

export default ExecutionLogPanel;