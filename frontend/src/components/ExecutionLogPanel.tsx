import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function ExecutionLogPanel() {
  const { state } = useDashboard();
  const { logs } = state;
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const toggleExpand = (filename: string) => {
    setExpandedLog((prev) => (prev === filename ? null : filename));
  };

  return (
    <section className="bg-secondary rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📜</span>
        <span>執行 Log</span>
      </h2>

      {logs.length === 0 ? (
        <p className="text-text-muted">暫無執行日誌</p>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log.filename} className="bg-primary rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-lg">{log.filename}</h3>
                  <p className="text-text-muted text-sm mt-1">
                    {log.timestamp}
                  </p>
                </div>
                <button
                  onClick={() => toggleExpand(log.filename)}
                  className="text-sm text-accent hover:text-blue-400 transition-colors"
                >
                  {expandedLog === log.filename ? '▼ 隱藏' : '▶ 展開'}
                </button>
              </div>

              {expandedLog === log.filename && (
                <div className="mt-3 bg-primary rounded border border-slate-700 p-3 overflow-x-auto">
                  <pre className="text-xs text-text whitespace-pre-wrap font-mono">
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

export default ExecutionLogPanel;
