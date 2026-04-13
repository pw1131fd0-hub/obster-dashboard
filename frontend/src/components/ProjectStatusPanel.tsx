import { useDashboard } from '../context/DashboardContext';
import type { Project } from '../types';

const STAGE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  prd:      { bg: 'bg-blue-600',   text: 'text-white', label: 'PRD'      },
  sa_sd:    { bg: 'bg-purple-600', text: 'text-white', label: 'SA/SD'    },
  dev:      { bg: 'bg-yellow-500', text: 'text-black', label: 'DEV'      },
  test:     { bg: 'bg-orange-500', text: 'text-white', label: 'TEST'     },
  security: { bg: 'bg-red-600',    text: 'text-white', label: 'SECURITY' },
  pre_prod: { bg: 'bg-pink-600',   text: 'text-white', label: 'PRE-PROD' },
  done:     { bg: 'bg-green-600',  text: 'text-white', label: 'DONE'     },
};

function getScoreColor(score: number): string {
  if (score >= 95) return 'text-success';
  if (score >= 85) return 'text-yellow-400';
  return 'text-error';
}

function ProjectCard({ project }: { project: Project }) {
  const stageConfig = STAGE_CONFIG[project.stage] ?? {
    bg: 'bg-gray-600',
    text: 'text-white',
    label: project.stage.toUpperCase(),
  };
  const qualityLow = project.quality_score < 85;

  return (
    <div className="bg-primary/60 rounded-lg p-4 mb-3 border border-white/5">
      {/* Title row */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-semibold text-text leading-tight">{project.name}</h3>
        <span
          className={`shrink-0 px-2 py-0.5 rounded text-xs font-bold ${stageConfig.bg} ${stageConfig.text}`}
        >
          {stageConfig.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div>
          <p className="text-text-muted text-xs mb-0.5">Quality</p>
          <p className={`font-bold text-base ${getScoreColor(project.quality_score)}`}>
            {project.quality_score}
          </p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-0.5">Iteration</p>
          <p className="font-semibold text-text">#{project.iteration}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-0.5">Stage</p>
          <p className="font-semibold text-text">{project.stage}</p>
        </div>
      </div>

      {/* Quality warning */}
      {qualityLow && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-error">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <span>Quality score below threshold (85)</span>
        </div>
      )}

      {/* Blocking errors */}
      {project.blocking_errors.length > 0 && (
        <div className="p-2.5 bg-error/10 rounded border border-error/25">
          <p className="text-error text-xs font-semibold mb-1">
            Blocking Errors ({project.blocking_errors.length})
          </p>
          <ul className="text-error text-xs list-disc list-inside space-y-0.5">
            {project.blocking_errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-text-muted text-xs mt-2 tabular-nums">
        Updated: {new Date(project.updated_at).toLocaleString()}
      </p>
    </div>
  );
}

export function ProjectStatusPanel() {
  const { state } = useDashboard();

  return (
    <div className="bg-secondary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span aria-hidden="true">📋</span>
        Project Status
      </h2>

      {state.projects.length === 0 ? (
        <p className="text-text-muted text-sm">No projects found</p>
      ) : (
        <div className="max-h-[36rem] overflow-y-auto pr-1">
          {state.projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
