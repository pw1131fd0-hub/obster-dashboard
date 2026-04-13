import { useDashboard } from '../context/DashboardContext';

const statusDotColors: Record<string, string> = {
  healthy: 'bg-success',
  unhealthy: 'bg-error',
  unknown: 'bg-slate-500',
  error: 'bg-error',
};

function AgentHealthPanel() {
  const { state } = useDashboard();
  const { agents } = state;

  return (
    <section className="bg-secondary rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>🤖</span>
        <span>Agent 健康度</span>
      </h2>

      {agents.length === 0 ? (
        <p className="text-text-muted">暫無 Agent 資料</p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.name} className="bg-primary rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full ${statusDotColors[agent.status] || 'bg-slate-500'}`}
                  />
                  <h3 className="font-medium text-lg">{agent.name}</h3>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === 'healthy'
                      ? 'bg-success/20 text-success'
                      : agent.status === 'unhealthy'
                      ? 'bg-error/20 text-error'
                      : 'bg-slate-600/20 text-text-muted'
                  }`}
                >
                  {agent.status === 'healthy'
                    ? 'Healthy'
                    : agent.status === 'unhealthy'
                    ? 'Unhealthy'
                    : agent.status === 'error'
                    ? 'Error'
                    : 'Unknown'}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Last Response: </span>
                  <span className="text-text">{agent.last_response || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-text-muted">Minutes Ago: </span>
                  <span className={agent.minutes_ago !== null && agent.minutes_ago >= 30 ? 'text-error' : 'text-text'}>
                    {agent.minutes_ago !== null ? `${agent.minutes_ago}` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default AgentHealthPanel;
