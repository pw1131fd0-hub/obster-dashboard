import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

interface LogCardProps {
  filename: string;
  timestamp: string;
  content: Record<string, unknown>;
}

function LogCard({ filename, timestamp, content }: LogCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-700 rounded p-3 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-accent rounded"
      >
        <div>
          <div className="font-medium text-text text-sm">{filename}</div>
          <div className="text-text-muted text-xs">{timestamp}</div>
        </div>
        <div className="text-text-muted">
          {expanded ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>
      {expanded && (
        <div className="mt-3 bg-primary rounded p-3 font-mono text-xs text-text overflow-x-auto whitespace-pre">
          {JSON.stringify(content, null, 2)}
        </div>
      )}
    </div>
  );
}

export function ExecutionLogPanel() {
  const { logs, loading } = useDashboard();

  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const latestLogs = sortedLogs.slice(0, 20);

  if (loading && logs.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text mb-4">Execution Logs</h2>
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-lg font-semibold text-text mb-4">Execution Logs</h2>
      {latestLogs.length === 0 ? (
        <div className="text-text-muted">No logs found</div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {latestLogs.map((log) => (
            <LogCard
              key={log.path}
              filename={log.filename}
              timestamp={log.timestamp}
              content={log.content}
            />
          ))}
        </div>
      )}
    </div>
  );
}
