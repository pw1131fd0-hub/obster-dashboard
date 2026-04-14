// API Response Types

export interface Project {
  name: string;
  path: string;
  stage: 'prd' | 'dev' | 'test' | 'security';
  iteration: number;
  quality_score: number;
  blocking_errors: string[];
  updated_at: string;
}

export interface ProjectResponse {
  projects: Project[];
  timestamp: string;
}

export interface CronJob {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'error' | 'timeout';
  last_run: string | null;
  exit_code: number | null;
  recent_logs: string[];
}

export interface CronJobResponse {
  cronjobs: CronJob[];
  timestamp: string;
}

export interface Agent {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'error';
  last_response: string | null;
  minutes_ago: number | null;
}

export interface AgentResponse {
  agents: Agent[];
  timestamp: string;
}

export interface ExecutionLog {
  filename: string;
  path: string;
  timestamp: string;
  content: Record<string, unknown>;
}

export interface LogResponse {
  logs: ExecutionLog[];
  count: number;
  timestamp: string;
}

export interface HealthResponse {
  status: 'healthy';
  uptime_seconds: number;
  version: string;
}

// Dashboard State Types

export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: ExecutionLog[];
  loading: {
    projects: boolean;
    cronjobs: boolean;
    agents: boolean;
    logs: boolean;
  };
  errors: {
    projects: string | null;
    cronjobs: string | null;
    agents: string | null;
    logs: string | null;
  };
  lastUpdated: string | null;
}

// Action Types

export type DashboardAction =
  | { type: 'FETCH_PROJECTS_REQUEST' }
  | { type: 'FETCH_PROJECTS_SUCCESS'; payload: Project[] }
  | { type: 'FETCH_PROJECTS_ERROR'; payload: string }
  | { type: 'FETCH_CRONJOBS_REQUEST' }
  | { type: 'FETCH_CRONJOBS_SUCCESS'; payload: CronJob[] }
  | { type: 'FETCH_CRONJOBS_ERROR'; payload: string }
  | { type: 'FETCH_AGENTS_REQUEST' }
  | { type: 'FETCH_AGENTS_SUCCESS'; payload: Agent[] }
  | { type: 'FETCH_AGENTS_ERROR'; payload: string }
  | { type: 'FETCH_LOGS_REQUEST' }
  | { type: 'FETCH_LOGS_SUCCESS'; payload: ExecutionLog[] }
  | { type: 'FETCH_LOGS_ERROR'; payload: string }
  | { type: 'SET_LAST_UPDATED' };

// Stage colors mapping
export const stageColors: Record<Project['stage'], string> = {
  prd: 'bg-accent',
  dev: 'bg-warning',
  test: 'bg-orange-500',
  security: 'bg-error',
};
