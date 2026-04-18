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
  content: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  uptime_seconds: number;
  version: string;
}

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
  logs: LogEntry[];
  count: number;
  timestamp: string;
}

export type RefreshInterval = 30000; // 30 seconds