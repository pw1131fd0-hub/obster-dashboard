import { useDashboard } from '../context/DashboardContext';

const stageColors: Record<string, string> = {
  prd: 'bg-[#3B82F6] text-[#F8FAFC]',
  dev: 'bg-[#F59E0B] text-[#0F172A]',
  test: 'bg-[#F97316] text-[#F8FAFC]',
  security: 'bg-[#EF4444] text-[#F8FAFC]',
};

export function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-[#F8FAFC] mb-4">Project Status</h2>
      {state.projects.length === 0 ? (
        <p className="text-[#94A3B8]">No projects found</p>
      ) : (
        <div className="space-y-4">
          {state.projects.map((project, idx) => (
            <div key={idx} className="border border-[#334155] rounded p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h3 className="font-medium text-[#F8FAFC]">{project.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${stageColors[project.stage] || 'bg-[#475569] text-[#F8FAFC]'}`}>
                  {project.stage.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-[#94A3B8]">Path: </span>
                  <span className="text-[#F8FAFC]">{project.path}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Iteration: </span>
                  <span className="text-[#F8FAFC]">{project.iteration}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Quality Score: </span>
                  <span className={project.quality_score < 85 ? 'text-[#EF4444]' : 'text-[#22C55E]'}>
                    {project.quality_score}%
                  </span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Updated: </span>
                  <span className="text-[#F8FAFC]">{new Date(project.updated_at).toLocaleString()}</span>
                </div>
              </div>
              {project.blocking_errors.length > 0 && (
                <div className="mt-2 p-2 bg-[#EF4444]/10 border border-[#EF4444] rounded">
                  <p className="text-sm font-medium text-[#EF4444] mb-1">Blocking Errors:</p>
                  <ul className="list-disc list-inside text-sm text-[#F8FAFC]">
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
    </div>
  );
}
