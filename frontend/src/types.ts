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
  status: 'active' | 'inactive' | 'failed' | 'error';
  last_run: string;
  exit_code: number;
  recent_logs: string[];
}

export interface Agent {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown' | 'error';
  last_response: string;
  minutes_ago: number;
}

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  content: string;
}

export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: LogEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Omit<DashboardState, 'loading' | 'error'> }
  | { type: 'FETCH_ERROR'; payload: string };
