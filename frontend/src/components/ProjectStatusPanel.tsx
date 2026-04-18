import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
};

function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <section className="bg-secondary rounded-xl p-6">
      <h2 className="text-lg font-semibold mb-4">📋 開發任務狀態</h2>
      {state.projects.length === 0 ? (
        <p className="text-text-muted">暂無專案資料</p>
      ) : (
        <div className="space-y-4">
          {state.projects.map((project) => (
            <div key={project.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs text-white ${stageColors[project.stage] || 'bg-slate-600'}`}>
                  {project.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Iteration: </span>
                  <span>#{project.iteration}</span>
                </div>
                <div>
                  <span className="text-text-muted">Quality: </span>
                  <span className={project.quality_score < 85 ? 'text-error' : 'text-success'}>
                    {project.quality_score}
                  </span>
                </div>
              </div>
              {project.blocking_errors.length > 0 && (
                <div className="mt-2">
                  <span className="text-error text-sm">Blocking Errors:</span>
                  <ul className="text-sm text-error mt-1 list-disc list-inside">
                    {project.blocking_errors.map((err, i) => (
                      <li key={i}>{err}</li>
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