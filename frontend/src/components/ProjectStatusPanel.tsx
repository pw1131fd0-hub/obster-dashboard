import { useDashboard } from '../context/DashboardContext'
import type { Project } from '../types'

const stageColors: Record<Project['stage'], string> = {
  prd: 'bg-blue-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
}

export default function ProjectStatusPanel() {
  const { state } = useDashboard()

  return (
    <section className="bg-secondary rounded-lg p-4 border border-slate-700">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📋 專案狀態
      </h2>
      {state.projects.length === 0 ? (
        <p className="text-text-muted">暂无專案資料</p>
      ) : (
        <div className="space-y-4">
          {state.projects.map((project, index) => (
            <div key={index} className="bg-primary rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-text-main">{project.name}</h3>
                  <p className="text-sm text-text-muted">{project.path}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs text-white ${stageColors[project.stage]}`}>
                  {project.stage}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-text-muted">Iteration:</span>
                  <span className="ml-2 text-text-main">{project.iteration}</span>
                </div>
                <div>
                  <span className="text-text-muted">Quality:</span>
                  <span className={`ml-2 ${project.quality_score < 85 ? 'text-error' : 'text-success'}`}>
                    {project.quality_score}
                  </span>
                </div>
              </div>
              {project.blocking_errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-error mb-1">Blocking Errors:</h4>
                  <ul className="text-sm text-error space-y-1">
                    {project.blocking_errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="text-xs text-text-muted mt-2">
                Updated: {new Date(project.updated_at).toLocaleString('zh-TW')}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
