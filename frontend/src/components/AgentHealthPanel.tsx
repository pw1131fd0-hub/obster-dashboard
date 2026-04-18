import { useDashboard } from '../context/DashboardContext';
import type { Agent } from '../types';

const statusColors: Record<Agent['status'], string> = {
  healthy: 'text-success',
  unhealthy: 'text-error',
  unknown: 'text-gray-400',
  error: 'text-error',
};

export default function AgentHealthPanel() {
  const { state } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">Agent 健康狀態</h2>
      {state.agents.length === 0 ? (
        <p className="text-text-muted">暂无 agent 資料</p>
      ) : (
        <div className="space-y-4">
          {state.agents.map((agent, index) => (
            <div key={index} className="bg-primary rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-text">{agent.name}</h3>
                <span className={`text-sm font-medium ${statusColors[agent.status]}`}>
                  {agent.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Last Response:</span>
                  <span className="ml-2 text-text">
                    {agent.last_response ? new Date(agent.last_response).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">Minutes Ago:</span>
                  <span className="ml-2 text-text">
                    {agent.minutes_ago !== null ? `${agent.minutes_ago} min` : 'N/A'}
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
