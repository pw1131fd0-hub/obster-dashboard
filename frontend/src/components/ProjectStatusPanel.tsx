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
      <h2 className="text-text font-semibold mb-4">Project Status</h2>
      {state.projects.length === 0 ? (
        <p className="text-text-muted">No projects available</p>
      ) : (
        <ul className="space-y-3">
          {state.projects.map((project, idx) => (
            <li key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-text">{project.name}</span>
                <span className={`${stageColors[project.stage] || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded uppercase`}>
                  {project.stage}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-text-muted">Score:</span>
                <span className={`font-medium ${project.quality_score < 85 ? 'text-error' : 'text-success'}`}>
                  {project.quality_score}
                </span>
                {project.quality_score < 85 && (
                  <span className="text-error text-sm" title="Quality score below threshold">!</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
