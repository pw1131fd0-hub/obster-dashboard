import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const statusDotColors: Record<string, string> = {
  healthy: 'bg-success',
  unhealthy: 'bg-error',
  unknown: 'bg-slate-500',
  error: 'bg-error',
};

export function AgentHealthPanel() {
  const { agents } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">Agent 健康度</h2>
      {agents.length === 0 ? (
        <p className="text-text-muted">暫無 Agent 資料</p>
      ) : (
        <div className="space-y-4">
          {agents.map((agent) => (
            <div key={agent.name} className="border border-slate-600 rounded p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{agent.name}</h3>
                <span
                  className={`w-3 h-3 rounded-full ${statusDotColors[agent.status] || 'bg-slate-500'}`}
                  title={agent.status}
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">最後回應: </span>
                  <span className={agent.status === 'unhealthy' ? 'text-error' : ''}>
                    {agent.last_response ? new Date(agent.last_response).toLocaleString('zh-TW') : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">分鐘前: </span>
                  <span className={agent.minutes_ago && agent.minutes_ago > 30 ? 'text-error font-medium' : ''}>
                    {agent.minutes_ago ?? 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
