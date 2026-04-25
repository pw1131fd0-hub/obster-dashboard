// Health response from /api/health
export interface HealthResponse {
  status: string;
  uptime: number;
  version: string;
}

// Project status from /api/projects
export interface Project {
  name: string;
  stage: 'prd' | 'dev' | 'test' | 'security';
  iteration: number;
  quality_score: number;
  blocking_errors: string[];
}

export interface ProjectResponse {
  projects: Project[];
}

// CronJob from /api/cronjobs
export interface CronJob {
  name: string;
  active: boolean;
  exit_code: number;
  last_run: string | null;
  recent_logs: string[];
}

export interface CronJobResponse {
  cronjobs: CronJob[];
}

// Agent from /api/agents
export interface Agent {
  name: string;
  last_response_time: string | null;
  minutes_ago: number | null;
  healthy: boolean;
}

export interface AgentResponse {
  agents: Agent[];
}

// Log entry from /api/logs
export interface LogEntry {
  filename: string;
  timestamp: string;
  content: Record<string, unknown>;
}

export interface LogResponse {
  logs: LogEntry[];
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
