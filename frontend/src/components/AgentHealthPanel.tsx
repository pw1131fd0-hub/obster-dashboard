import { useDashboard } from '../context/DashboardContext';

const statusDotColors: Record<string, string> = {
  healthy: 'bg-success',
  unhealthy: 'bg-error',
  unknown: 'bg-text-muted',
  error: 'bg-error',
};

function AgentHealthPanel() {
  const { state } = useDashboard();

  const getAgentStatus = (agent: { status: string; minutes_ago: number | null }): string => {
    if (agent.status === 'unhealthy' || agent.status === 'error') {
      return 'unhealthy';
    }
    if (agent.status === 'unknown') {
      return 'unknown';
    }
    if (agent.minutes_ago !== null && agent.minutes_ago >= 30) {
      return 'unhealthy';
    }
    return 'healthy';
  };

  return (
    <section className="panel">
      <h2 className="panel-title flex items-center gap-2">
        <span>&#x1F916;</span>
        <span>Agent Health</span>
      </h2>
      {state.agents.length === 0 ? (
        <p className="text-text-muted">No agents available</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {state.agents.map((agent) => {
            const agentStatus = getAgentStatus(agent);
            return (
              <div key={agent.name} className="border border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{agent.name}</h3>
                  <span className={`status-dot ${statusDotColors[agentStatus]}`} />
                </div>
                <div className="mt-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    agentStatus === 'healthy' ? 'bg-success/20 text-success' :
                    agentStatus === 'unhealthy' ? 'bg-error/20 text-error' :
                    'bg-text-muted/20 text-text-muted'
                  }`}>
                    {agentStatus}
                  </span>
                </div>
                {agent.last_response && (
                  <p className="text-sm text-text-muted mt-2">
                    Last: {agent.last_response}
                  </p>
                )}
                {agent.minutes_ago !== null && (
                  <p className="text-sm text-text-muted">
                    {agent.minutes_ago} min ago
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default AgentHealthPanel;