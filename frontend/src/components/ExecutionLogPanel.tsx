import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

function LogEntryRow({ entry }: { entry: { filename: string; path: string; timestamp: string; content: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-[#334155] rounded p-3 mb-2">
      <div className="flex flex-wrap items-center justify-between gap-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h4 className="font-medium text-[#F8FAFC]">{entry.filename}</h4>
          <span className="text-sm text-[#94A3B8]">{entry.path}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#94A3B8]">{new Date(entry.timestamp).toLocaleString()}</span>
          <span className="text-[#94A3B8]">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 p-3 bg-[#0F172A] rounded font-mono text-xs text-[#F8FAFC] overflow-x-auto whitespace-pre">
          {entry.content}
        </div>
      )}
    </div>
  );
}

export function ExecutionLogPanel() {
  const { state } = useDashboard();
  const displayedLogs = state.logs.slice(0, 20);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Execution Logs</h2>
      {displayedLogs.length === 0 ? (
        <p className="text-[#94A3B8]">No logs found</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {displayedLogs.map((entry, idx) => (
            <LogEntryRow key={idx} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
