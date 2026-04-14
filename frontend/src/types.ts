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

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  content: Record<string, unknown> | null;
}

export interface LogResponse {
  logs: LogEntry[];
  count: number;
  timestamp: string;
}

export interface HealthResponse {
  status: 'healthy';
  uptime_seconds: number;
  version: string;
}

export interface ConfigResponse {
  [key: string]: unknown;
}

// Dashboard State Types

export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: LogEntry[];
  config: ConfigResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Action Types

export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardState> }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_LAST_UPDATED' }
  | { type: 'CLEAR_ERROR' };

// Stage colors mapping
export const stageColors: Record<Project['stage'], string> = {
  prd: 'bg-accent',
  dev: 'bg-warning',
  test: 'bg-orange-500',
  security: 'bg-error',
};