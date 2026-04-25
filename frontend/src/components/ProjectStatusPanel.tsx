import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500 text-white',
  dev: 'bg-yellow-500 text-black',
  test: 'bg-orange-500 text-white',
  security: 'bg-red-500 text-white',
};

function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <section className="panel">
      <h2 className="panel-title flex items-center gap-2">
        <span>&#x1F4CB;</span>
        <span>開發任務狀態</span>
      </h2>
      {state.projects.length === 0 ? (
        <p className="text-muted">暂無專案資料</p>
      ) : (
        <div className="space-y-4">
          {state.projects.map((project) => (
            <div key={project.name} className="border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${stageColors[project.stage] || 'bg-slate-600 text-white'}`}>
                  {project.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted">Iteration: </span>
                  <span>#{project.iteration}</span>
                </div>
                <div>
                  <span className="text-muted">Quality: </span>
                  <span className={project.quality_score < 85 ? 'text-error font-medium' : 'text-success'}>
                    {project.quality_score}
                    {project.quality_score < 85 && ' &#x26A0;'}
                  </span>
                </div>
              </div>
              {project.blocking_errors.length > 0 && (
                <div className="mt-2">
                  <span className="text-error text-sm font-medium">Blocking Errors:</span>
                  <ul className="text-sm text-error mt-1 list-disc list-inside">
                    {project.blocking_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-muted mt-2">
                Updated: {new Date(project.updated_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProjectStatusPanel;