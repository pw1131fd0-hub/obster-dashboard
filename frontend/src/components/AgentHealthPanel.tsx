import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusColors: Record<string, string> = {
  healthy: 'bg-success',
  unhealthy: 'bg-error',
  unknown: 'bg-gray-500',
};

const agentOrder = ['Argus', 'Hephaestus', 'Atlas', 'Hestia', 'Hermes', 'Main'];

export default function AgentHealthPanel() {
  const { state } = useDashboard();

  const sortedAgents = [...state.agents].sort((a, b) => {
    const aIdx = agentOrder.indexOf(a.name);
    const bIdx = agentOrder.indexOf(b.name);
    if (aIdx === -1 && bIdx === -1) return a.name.localeCompare(b.name);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <section className="bg-secondary rounded-lg p-4">
      <h2 className="text-text font-semibold mb-4">Agent Health</h2>
      {sortedAgents.length === 0 ? (
        <p className="text-text-muted">No agents available</p>
      ) : (
        <ul className="space-y-3">
          {sortedAgents.map((agent) => (
            <li key={agent.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${statusColors[agent.status] || 'bg-gray-500'}`} />
                <span className="text-text">{agent.name}</span>
              </div>
              <span className="text-text-muted text-sm">
                {agent.minutes_ago != null ? `${agent.minutes_ago}m ago` : 'N/A'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
