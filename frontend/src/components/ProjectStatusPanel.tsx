import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-accent',
  dev: 'bg-warning',
  test: 'bg-orange-500',
  security: 'bg-error',
};

const stageLabels: Record<string, string> = {
  prd: 'PRD',
  dev: 'DEV',
  test: 'TEST',
  security: 'SECURITY',
};

function ProjectStatusPanel() {
  const { state } = useDashboard();
  const { projects } = state;

  return (
    <section className="bg-secondary rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <span>📋</span>
        <span>開發任務狀態</span>
      </h2>

      {projects.length === 0 ? (
        <p className="text-text-muted">暫無專案資料</p>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.path} className="bg-primary rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-lg">{project.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium text-white ${stageColors[project.stage] || 'bg-slate-600'}`}
                >
                  {stageLabels[project.stage] || project.stage.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">迭代: </span>
                  <span className="text-text">#{project.iteration}</span>
                </div>
                <div>
                  <span className="text-text-muted">品質分數: </span>
                  <span className={project.quality_score < 85 ? 'text-error' : 'text-success'}>
                    {project.quality_score}
                  </span>
                </div>
              </div>

              {project.blocking_errors && project.blocking_errors.length > 0 && (
                <div className="mt-3">
                  <span className="text-text-muted text-sm">Blocking Errors:</span>
                  <ul className="mt-1 space-y-1">
                    {project.blocking_errors.map((error, idx) => (
                      <li key={idx} className="text-error text-sm flex items-start gap-1">
                        <span>•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectStatusPanel;
