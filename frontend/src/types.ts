export interface Project {
  name: string;
  path: string;
  stage: string;
  iteration: number;
  quality_score: number;
  blocking_errors: string[];
  updated_at: string;
}

export interface CronJob {
  name: string;
  status: string;
  last_run: string | null;
  exit_code: number | null;
  recent_logs: string[];
}

export interface Agent {
  name: string;
  status: string;
  last_response: string | null;
  minutes_ago: number | null;
}

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  content: Record<string, unknown>;
}

export interface DashboardState {
  projects: Project[];
  cronjobs: CronJob[];
  agents: Agent[];
  logs: LogEntry[];
  lastRefresh: string | null;
  error: string | null;
}

export type DashboardAction =
  | { type: 'SET_DATA'; payload: Partial<DashboardState> }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };