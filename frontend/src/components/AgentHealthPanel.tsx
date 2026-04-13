import { useDashboard } from '../context/DashboardContext';
import type { Agent } from '../types';

type HealthStatus = 'healthy' | 'unhealthy' | 'unknown' | 'error';

function getStatusConfig(status: string): {
  dotClass: string;
  textClass: string;
  cardClass: string;
  label: string;
} {
  const s = status as HealthStatus;
  switch (s) {
    case 'healthy':
      return {
        dotClass: 'bg-success ring-success/30',
        textClass: 'text-success',
        cardClass: 'border-success/20 bg-success/5',
        label: 'HEALTHY',
      };
    case 'unhealthy':
    case 'error':
      return {
        dotClass: 'bg-error ring-error/30',
        textClass: 'text-error',
        cardClass: 'border-error/20 bg-error/5',
        label: s === 'error' ? 'ERROR' : 'UNHEALTHY',
      };
    default:
      return {
        dotClass: 'bg-text-muted ring-text-muted/20',
        textClass: 'text-text-muted',
        cardClass: 'border-white/10 bg-white/3',
        label: 'UNKNOWN',
      };
  }
}

function AgentCard({ agent }: { agent: Agent }) {
  const { dotClass, textClass, cardClass, label } = getStatusConfig(agent.status);

  return (
    <div className={`rounded-lg p-4 mb-3 border ${cardClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-block w-3 h-3 rounded-full ring-2 shrink-0 ${dotClass}`}
            role="img"
            aria-label={label}
          />
          <h3 className="font-semibold text-text">{agent.name}</h3>
        </div>
        <span className={`text-xs font-bold tracking-wide ${textClass}`}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-text-muted text-xs mb-0.5">Last Response</p>
          <p className={`text-xs font-medium ${textClass}`}>
            {agent.last_response
              ? new Date(agent.last_response).toLocaleString()
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-0.5">Minutes Ago</p>
          <p
            className={`text-sm font-bold ${
              agent.minutes_ago !== null && agent.minutes_ago >= 30
                ? 'text-error'
                : textClass
            }`}
          >
            {agent.minutes_ago !== null ? `${agent.minutes_ago}m` : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AgentHealthPanel() {
  const { state } = useDashboard();

  const healthyCount = state.agents.filter((a) => a.status === 'healthy').length;
  const total = state.agents.length;

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <span aria-hidden="true">🤖</span>
        Agent Health
      </h2>
      <p className="text-text-muted text-xs mb-4">
        Unhealthy after 30 min without response
        {total > 0 && (
          <span className="ml-2 text-text">
            ({healthyCount}/{total} healthy)
          </span>
        )}
      </p>

      {state.agents.length === 0 ? (
        <p className="text-text-muted text-sm">No agents configured</p>
      ) : (
        <div className="max-h-[36rem] overflow-y-auto pr-1">
          {state.agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
