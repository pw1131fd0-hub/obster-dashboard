export interface ProjectResponse {
  projects: Project[];
}

export interface Project {
  name: string;
  stage: 'prd' | 'dev' | 'test' | 'security';
  quality_score: number;
}

export interface CronJobResponse {
  cron_jobs: CronJob[];
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  last_run: string;
  last_exit_code: number;
  status: 'running' | 'completed' | 'failed';
  recent_logs: string[];
}

export interface AgentResponse {
  agents: Agent[];
}

export interface Agent {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  last_seen_minutes_ago: number;
}

export interface LogResponse {
  logs: Log[];
}

export interface Log {
  timestamp: string;
  filename: string;
  content: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

export interface DashboardState {
  projects: Project[];
  cronJobs: CronJob[];
  agents: Agent[];
  logs: Log[];
  lastUpdated: string | null;
  error: string | null;
  loading: boolean;
}

export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Omit<DashboardState, 'error' | 'loading'> }
  | { type: 'FETCH_ERROR'; payload: string };
