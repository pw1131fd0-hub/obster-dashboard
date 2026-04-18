import { useDashboard } from '../context/DashboardContext';

const statusDotColors: Record<string, string> = {
  healthy: 'bg-success',
  unhealthy: 'bg-error',
  unknown: 'bg-gray-500',
  error: 'bg-error',
};

const AGENT_NAMES = ['Argus', 'Hephaestus', 'Atlas', 'Hestia', 'Hermes', 'Main'];

export function AgentHealthPanel() {
  const { agents, loading } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4 h-full shadow-lg">
      <h2 className="text-lg font-semibold mb-4 text-text">🤖 Agent 健康度</h2>
      {loading && agents.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-text-muted">Loading...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {AGENT_NAMES.map((agentName) => {
            const agent = agents.find((a) => a.name === agentName);
            return (
              <div key={agentName} className="border border-gray-700 rounded p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-text">{agentName}</h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        statusDotColors[agent?.status || 'unknown']
                      }`}
                    />
                    <span className="text-sm text-text-muted capitalize">
                      {agent?.status || 'unknown'}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-text-muted mt-1">
                  {agent?.last_response ? (
                    <>
                      <p>Last response: {new Date(agent.last_response).toLocaleString()}</p>
                      {agent.minutes_ago !== null && (
                        <p>{agent.minutes_ago} minutes ago</p>
                      )}
                    </>
                  ) : (
                    <p>No response data</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
