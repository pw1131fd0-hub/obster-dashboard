import { useDashboard } from '../context/DashboardContext';

const statusBadgeColors: Record<string, string> = {
  healthy: 'bg-[#22C55E] text-[#0F172A]',
  unhealthy: 'bg-[#EF4444] text-[#F8FAFC]',
  unknown: 'bg-[#94A3B8] text-[#0F172A]',
  error: 'bg-[#EF4444] text-[#F8FAFC]',
};

export function AgentHealthPanel() {
  const { state } = useDashboard();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Agent Health</h2>
      {state.agents.length === 0 ? (
        <p className="text-[#94A3B8]">No agents found</p>
      ) : (
        <div className="space-y-4">
          {state.agents.map((agent, idx) => (
            <div key={idx} className="border border-[#334155] rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium text-[#F8FAFC]">{agent.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${statusBadgeColors[agent.status] || 'bg-[#475569] text-[#F8FAFC]'}`}>
                  {agent.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                <div>
                  <span className="text-[#94A3B8]">Last Response: </span>
                  <span className="text-[#F8FAFC]">{new Date(agent.last_response).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Minutes Ago: </span>
                  <span className="text-[#F8FAFC]">{agent.minutes_ago}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
