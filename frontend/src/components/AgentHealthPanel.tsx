import { useDashboard } from '../context/DashboardContext';

function AgentHealthPanel() {
  const { state } = useDashboard();

  const statusColors: Record<string, string> = {
    healthy: 'text-success',
    unhealthy: 'text-error',
    unknown: 'text-text-muted',
    error: 'text-error',
  };

  const statusIcons: Record<string, string> = {
    healthy: '●',
    unhealthy: '●',
    unknown: '○',
    error: '●',
  };

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🤖 Agent 健康度
      </h2>
      {state.agents.length === 0 ? (
        <p className="text-text-muted">暫無 Agent 資料</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {state.agents.map((agent) => (
            <div key={agent.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{agent.name}</h3>
                <span className={statusColors[agent.status] || 'text-text-muted'}>
                  {statusIcons[agent.status] || '○'}
                </span>
              </div>
              <div className="mt-2 text-sm">
                <span className="text-text-muted">Status: </span>
                <span className={statusColors[agent.status] || 'text-text-muted'}>
                  {agent.status}
                </span>
              </div>
              {agent.minutes_ago !== null && (
                <div className="text-sm">
                  <span className="text-text-muted">Last Response: </span>
                  <span className={agent.minutes_ago >= 30 ? 'text-error' : 'text-text'}>
                    {Math.round(agent.minutes_ago)} 分鐘前
                  </span>
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