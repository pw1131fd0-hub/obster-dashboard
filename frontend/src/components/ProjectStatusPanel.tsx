import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
};

export function ProjectStatusPanel() {
  const { projects } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-6 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4">開發任務狀態</h2>
      {projects.length === 0 ? (
        <p className="text-text-muted">暫無專案資料</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.path} className="border border-slate-600 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{project.name}</h3>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded text-white ${stageColors[project.stage] || 'bg-slate-500'}`}
                >
                  {project.stage.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">迭代: </span>
                  <span>#{project.iteration}</span>
                </div>
                <div>
                  <span className="text-text-muted">品質分數: </span>
                  <span className={project.quality_score < 85 ? 'text-error font-medium' : ''}>
                    {project.quality_score}
                  </span>
                </div>
              </div>
              {project.blocking_errors.length > 0 && (
                <div className="mt-3">
                  <span className="text-error text-sm font-medium">Blocking Errors:</span>
                  <ul className="mt-1 text-sm text-error">
                    {project.blocking_errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
