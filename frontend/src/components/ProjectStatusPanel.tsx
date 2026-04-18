import { useDashboard } from '../context/DashboardContext';
import type { Project } from '../types';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-600',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-600',
};

export function ProjectStatusPanel() {
  const { projects, loading } = useDashboard();

  if (loading && projects.length === 0) {
    return (
      <div className="bg-secondary rounded-lg p-4">
        <h2 className="text-lg font-semibold text-text mb-4">Project Status</h2>
        <div className="text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-lg font-semibold text-text mb-4">Project Status</h2>
      {projects.length === 0 ? (
        <div className="text-text-muted">No projects found</div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: Project) => {
            const isQualityLow = project.quality_score < 85;
            return (
              <div key={project.path} className="border border-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text">{project.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs text-white ${stageColors[project.stage] || 'bg-gray-600'}`}>
                    {project.stage.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-text-muted">Iteration:</span>
                    <span className="text-text ml-1">{project.iteration}</span>
                  </div>
                  <div className={isQualityLow ? 'text-error' : 'text-success'}>
                    <span className="text-text-muted">Quality:</span>
                    <span className="ml-1">{project.quality_score}</span>
                    {isQualityLow && (
                      <svg className="inline-block w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                {project.blocking_errors && project.blocking_errors.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-error font-medium">Blocking Errors:</span>
                    <ul className="mt-1 text-sm text-error">
                      {project.blocking_errors.map((error: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
