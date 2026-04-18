import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function ExecutionLogPanel() {
  const { state } = useDashboard();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📜 執行 Log
      </h2>
      {state.logs.length === 0 ? (
        <p className="text-text-muted">暫無 Log 資料</p>
      ) : (
        <div className="space-y-4">
          {state.logs.slice(0, 20).map((log) => (
            <div key={log.filename} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{log.filename}</h3>
                  <p className="text-sm text-text-muted">{log.timestamp}</p>
                </div>
                <button
                  onClick={() => setExpandedLog(expandedLog === log.filename ? null : log.filename)}
                  className="text-sm text-accent hover:underline"
                >
                  {expandedLog === log.filename ? '隱藏內容' : '展開內容'}
                </button>
              </div>
              {expandedLog === log.filename && (
                <div className="mt-3 bg-primary rounded p-3 font-mono text-xs overflow-x-auto">
                  <pre className="whitespace-pre-wrap">
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