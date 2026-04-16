import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  active: 'bg-[#22C55E] text-[#0F172A]',
  inactive: 'bg-[#94A3B8] text-[#0F172A]',
  failed: 'bg-[#EF4444] text-[#F8FAFC]',
  error: 'bg-[#EF4444] text-[#F8FAFC]',
};

function LogToggle({ logs }: { logs: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-[#3B82F6] hover:text-[#2563EB] focus:outline-none focus:underline"
      >
        {isOpen ? 'Hide Logs' : 'Show Logs'}
      </button>
      {isOpen && (
        <div className="mt-2 p-2 bg-[#0F172A] rounded font-mono text-xs text-[#F8FAFC] max-h-32 overflow-y-auto">
          {logs.slice(0, 5).map((log, i) => (
            <div key={i} className="truncate">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CronJobPanel() {
  const { state } = useDashboard();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Cron Jobs</h2>
      {state.cronjobs.length === 0 ? (
        <p className="text-[#94A3B8]">No cron jobs found</p>
      ) : (
        <div className="space-y-4">
          {state.cronjobs.map((job, idx) => (
            <div key={idx} className="border border-[#334155] rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-[#F8FAFC]">{job.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[job.status] || 'bg-[#475569] text-[#F8FAFC]'}`}>
                  {job.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-[#94A3B8]">Last Run: </span>
                  <span className="text-[#F8FAFC]">{new Date(job.last_run).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Exit Code: </span>
                  <span className={job.exit_code === 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
                    {job.exit_code}
                  </span>
                </div>
              </div>
              {job.recent_logs.length > 0 && (
                <LogToggle logs={job.recent_logs} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
