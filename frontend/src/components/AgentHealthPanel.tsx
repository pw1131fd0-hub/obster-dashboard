import { useDashboard } from '../context/DashboardContext';
import type { Agent } from '../types';

function getHealthStatus(agent: Agent) {
  if (agent.status === 'unhealthy' || agent.status === 'error') {
    return { icon: '🔴', color: 'text-error', bgColor: 'bg-error/10 border-error/30' };
  }
  if (agent.status === 'unknown') {
    return { icon: '⚪', color: 'text-text-muted', bgColor: 'bg-gray-500/10 border-gray-500/30' };
  }
  return { icon: '🟢', color: 'text-success', bgColor: 'bg-success/10 border-success/30' };
}

function AgentCard({ agent }: { agent: Agent }) {
  const { icon, color, bgColor } = getHealthStatus(agent);

  return (
    <div className={`rounded-lg p-4 mb-3 border ${bgColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{icon}</span>
          <h3 className="font-semibold text-lg">{agent.name}</h3>
        </div>
        <span className={`text-sm font-medium ${color}`}>
          {agent.status.toUpperCase()}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-text-muted">Last Response</span>
          <p className={`font-semibold ${color}`}>
            {agent.last_response ? new Date(agent.last_response).toLocaleString() : 'N/A'}
          </p>
        </div>
        <div>
          <span className="text-text-muted">Minutes Ago</span>
          <p className={`font-bold ${agent.minutes_ago !== null && agent.minutes_ago >= 30 ? 'text-error' : color}`}>
            {agent.minutes_ago !== null ? `${agent.minutes_ago}m` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgentHealthPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">🤖</span> Agent 健康度
        <span className="ml-2 text-xs text-text-muted">(30 分鐘未回應 = 異常)</span>
      </h2>
      {state.agents.length === 0 ? (
        <p className="text-text-muted">No agents configured</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {state.agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}