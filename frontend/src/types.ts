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

export interface LogEntry {
  filename: string;
  path: string;
  timestamp: string;
  content: any;
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
