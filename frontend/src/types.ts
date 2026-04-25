// Health response from /api/health
export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  version: string;
}

// Project status from /api/projects
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
}

// CronJob from /api/cronjobs
export interface CronJob {
  name: string;
  status: 'active' | 'inactive' | 'failed' | 'error';
  last_run: string | null;
  exit_code: number | null;
  recent_logs: string[];
}

export interface CronJobResponse {
  cronjobs: CronJob[];
}

// Agent from /api/agents
export interface Agent {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'error';
  last_response: string | null;
  minutes_ago: number | null;
}

export interface AgentResponse {
  agents: Agent[];
}

// Log entry from /api/logs
export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  content: Record<string, unknown>;
}

export interface LogResponse {
  logs: LogEntry[];
  count: number;
}

// Dashboard state
export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: LogEntry[];
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Action types
export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardState> }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_LAST_UPDATED' };
