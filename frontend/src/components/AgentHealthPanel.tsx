import { useDashboard } from '../context/DashboardContext';

function AgentHealthPanel() {
  const { state } = useDashboard();

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy':
        return 'text-success';
      case 'unhealthy':
        return 'text-error';
      case 'unknown':
        return 'text-text-muted';
      case 'error':
        return 'text-error';
      default:
        return 'text-text-muted';
    }
  };

  const getStatusIndicator = (status: string, minutesAgo: number | null): string => {
    if (status === 'healthy' && minutesAgo !== null && minutesAgo < 30) {
      return 'bg-success';
    }
    if (status === 'unhealthy' || status === 'error' || (minutesAgo !== null && minutesAgo >= 30)) {
      return 'bg-error';
    }
    return 'bg-text-muted';
  };

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">Agent Health</h2>
      {state.agents.length === 0 ? (
        <p className="text-text-muted">No agents available</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {state.agents.map((agent) => (
            <div key={agent.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{agent.name}</h3>
                <span className={`w-3 h-3 rounded-full ${getStatusIndicator(agent.status, agent.minutes_ago)}`} />
              </div>
              <div className="mt-2">
                <span className="text-text-muted">Status: </span>
                <span className={getStatusColor(agent.status)}>{agent.status}</span>
              </div>
              {agent.last_response && (
                <div className="text-sm">
                  <span className="text-text-muted">Last Response: </span>
                  <span className={agent.minutes_ago !== null && agent.minutes_ago >= 30 ? 'text-error' : 'text-text'}>
                    {agent.last_response}
                  </span>
                </div>
              )}
              {agent.minutes_ago !== null && (
                <div className="text-sm text-text-muted">
                  {agent.minutes_ago} minutes ago
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AgentHealthPanel;