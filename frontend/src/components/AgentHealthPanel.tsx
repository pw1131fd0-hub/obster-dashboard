import { useDashboard } from '../context/DashboardContext';

function getStatusIndicator(status: string): { color: string; label: string } {
  switch (status) {
    case 'healthy':
      return { color: 'bg-success', label: 'Healthy' };
    case 'unhealthy':
      return { color: 'bg-error', label: 'Unhealthy' };
    case 'error':
      return { color: 'bg-error', label: 'Error' };
    default:
      return { color: 'bg-gray-500', label: 'Unknown' };
  }
}

const AGENT_NAMES = ['Argus', 'Hephaestus', 'Atlas', 'Hestia', 'Hermes', 'Main'];

export function AgentHealthPanel() {
  const { agents, loading } = useDashboard();

  if (loading && agents.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text mb-4">Agent Health</h2>
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  const agentMap = new Map(agents.map((a) => [a.name, a]));
  const displayAgents = AGENT_NAMES.map((name) => {
    return agentMap.get(name) || { name, status: 'unknown', last_response: null, minutes_ago: null };
  });

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-lg font-semibold text-text mb-4">Agent Health</h2>
      <div className="space-y-3">
        {displayAgents.map((agent) => {
          const indicator = getStatusIndicator(agent.status);
          return (
            <div key={agent.name} className="border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-text">{agent.name}</span>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${indicator.color} mr-2`}></span>
                  <span className={`text-sm ${indicator.color.replace('bg-', 'text-')}`}>
                    {indicator.label}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <div className="text-text-muted">
                  Last Response: <span className="text-text">{agent.last_response || 'N/A'}</span>
                </div>
                <div className="text-text-muted">
                  Minutes Ago: <span className="text-text">{agent.minutes_ago ?? '—'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
