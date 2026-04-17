import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
};

export function ProjectStatusPanel() {
  const { projects, loading } = useDashboard();

  return (
    <section className="bg-secondary rounded-lg p-4 h-full">
      <h2 className="text-lg font-semibold mb-4 text-text">Project Status</h2>
      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-pulse text-text-muted">Loading...</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-text-muted">
          No projects found
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.path} className="border border-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-text">{project.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded text-xs text-white ${
                    stageColors[project.stage] || 'bg-gray-500'
                  }`}
                >
                  {project.stage}
                </span>
              </div>
              <div className="text-sm text-text-muted space-y-1">
                <p>Iteration: {project.iteration}</p>
                <p>
                  Quality Score:{' '}
                  <span
                    className={
                      project.quality_score < 85 ? 'text-error font-semibold' : 'text-success'
                    }
                  >
                    {project.quality_score}
                  </span>
                </p>
                {project.blocking_errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-error font-medium">Blocking Errors:</p>
                    <ul className="list-disc list-inside text-error">
                      {project.blocking_errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
