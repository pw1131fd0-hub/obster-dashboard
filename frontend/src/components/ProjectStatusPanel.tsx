import React from 'react';
import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
};

export default function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4">
      <h2 className="text-text font-semibold mb-4">📋 開發任務狀態</h2>
      {state.projects.length === 0 ? (
        <p className="text-text-muted">No projects available</p>
      ) : (
        <ul className="space-y-4">
          {state.projects.map((project) => (
            <li key={project.path} className="border border-primary rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-text font-medium">{project.name}</span>
                  <span className={`${stageColors[project.stage] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded uppercase`}>
                    {project.stage}
                  </span>
                </div>
                <span className="text-text-muted text-sm">Iteration {project.iteration}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">Quality Score:</span>
                  <span className={`font-bold ${project.quality_score < 85 ? 'text-error' : 'text-success'}`}>
                    {project.quality_score}
                  </span>
                  {project.quality_score < 85 && (
                    <span className="text-error text-sm" title="Quality score below threshold">⚠️</span>
                  )}
                </div>
              </div>
              {project.blocking_errors && project.blocking_errors.length > 0 && (
                <div className="mt-3 bg-error/10 border border-error/30 rounded p-2">
                  <span className="text-error text-sm font-medium">Blocking Errors:</span>
                  <ul className="mt-1 text-error text-xs space-y-1">
                    {project.blocking_errors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
