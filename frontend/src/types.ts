export interface Project {
  name: string;
  path: string;
  stage: 'prd' | 'dev' | 'test' | 'security';
  iteration: number;
  quality_score: number;
  blocking_errors: string[];
  updated_at: string;
}

export interface CronJob {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'error' | 'timeout';
  last_run: string | null;
  exit_code: number | null;
  recent_logs: string[];
}

export interface Agent {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'error';
  last_response: string | null;
  minutes_ago: number | null;
}

export interface ExecutionLog {
  filename: string;
  path: string;
  timestamp: string;
  content: Record<string, unknown>;
}

export type LogEntry = ExecutionLog;

export interface ProjectResponse {
  projects: Project[];
  timestamp: string;
}

export interface CronJobResponse {
  cronjobs: CronJob[];
  timestamp: string;
}

export interface AgentResponse {
  agents: Agent[];
  timestamp: string;
}

export interface LogResponse {
  logs: ExecutionLog[];
  count: number;
  timestamp: string;
}

export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  version: string;
}

export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: ExecutionLog[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardState> }
  | { type: 'FETCH_ERROR'; error: string };