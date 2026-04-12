import { useDashboard } from '../context/DashboardContext';
import type { Project } from '../types';

const stageColors: Record<string, string> = {
  prd: 'bg-blue-500',
  sa_sd: 'bg-purple-500',
  dev: 'bg-yellow-500',
  test: 'bg-orange-500',
  security: 'bg-red-500',
  pre_prod: 'bg-pink-500',
  done: 'bg-green-500',
};

function getScoreColor(score: number): string {
  if (score >= 95) return 'text-success';
  if (score >= 85) return 'text-yellow-400';
  return 'text-error';
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="bg-secondary rounded-lg p-4 mb-3">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg">{project.name}</h3>
        <span className={`px-2 py-1 rounded text-xs text-white ${stageColors[project.stage] || 'bg-gray-500'}`}>
          {project.stage.toUpperCase()}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <span className="text-text-muted">Quality</span>
          <p className={`font-bold ${getScoreColor(project.quality_score)}`}>{project.quality_score}</p>
        </div>
        <div>
          <span className="text-text-muted">Iteration</span>
          <p className="font-semibold">#{project.iteration}</p>
        </div>
        <div>
          <span className="text-text-muted">Stage</span>
          <p className="font-semibold">{project.stage}</p>
        </div>
      </div>
      {project.blocking_errors.length > 0 && (
        <div className="mt-2 p-2 bg-error/20 rounded border border-error/30">
          <p className="text-error text-sm font-medium">Blocking Errors:</p>
          <ul className="text-error text-xs list-disc list-inside">
            {project.blocking_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-text-muted text-xs mt-2">Updated: {new Date(project.updated_at).toLocaleString()}</p>
    </div>
  );
}

export function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <span className="mr-2">📋</span> 開發任務狀態
      </h2>
      {state.projects.length === 0 ? (
        <p className="text-text-muted">No projects found</p>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {state.projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}