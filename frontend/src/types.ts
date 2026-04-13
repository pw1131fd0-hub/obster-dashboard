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
  status: 'active' | 'inactive' | 'failed' | 'error';
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
  content: Record<string, unknown>;
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
  refresh_interval: number;
  timeout_minutes: number;
  agents: string[];
}

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

export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<Omit<DashboardState, 'loading' | 'error' | 'lastUpdated'>> }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_LAST_UPDATED' };
