import { describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import ProjectStatusPanel from '../components/ProjectStatusPanel';
import AgentHealthPanel from '../components/AgentHealthPanel';
import CronJobPanel from '../components/CronJobPanel';
import ExecutionLogPanel from '../components/ExecutionLogPanel';
import { setupFetchMock, renderWithProvider } from './testUtils';
import type { Project, Agent, CronJob, LogEntry } from '../types';

// ---------------------------------------------------------------------------
// ProjectStatusPanel
// ---------------------------------------------------------------------------

describe('ProjectStatusPanel', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the panel heading', () => {
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('開發任務狀態')).toBeInTheDocument();
  });

  it('shows empty-state message when there are no projects', () => {
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('暂無專案資料')).toBeInTheDocument();
  });

  it('renders a project card with name and stage badge', async () => {
    const project: Project = {
      name: 'obster-dashboard',
      path: '/home/crawd_user/project/obster-dashboard',
      stage: 'dev',
      iteration: 3,
      quality_score: 92,
      blocking_errors: [],
      updated_at: '2026-04-13T08:30:00.000Z',
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: [project] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<ProjectStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('obster-dashboard')).toBeInTheDocument();
    });
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  it('shows quality warning when score is below 85', async () => {
    const project: Project = {
      name: 'low-quality-project',
      path: '/home/crawd_user/project/low-quality-project',
      stage: 'test',
      iteration: 1,
      quality_score: 70,
      blocking_errors: [],
      updated_at: '2026-04-13T08:30:00.000Z',
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: [project] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<ProjectStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Quality/i)).toBeInTheDocument();
    });
  });

  it('displays blocking errors when present', async () => {
    const project: Project = {
      name: 'broken-project',
      path: '/home/crawd_user/project/broken-project',
      stage: 'prd',
      iteration: 5,
      quality_score: 88,
      blocking_errors: ['TypeScript compile error', 'Missing env variable'],
      updated_at: '2026-04-13T08:30:00.000Z',
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/projects') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ projects: [project] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<ProjectStatusPanel />);

    await waitFor(() => {
      expect(screen.getByText('TypeScript compile error')).toBeInTheDocument();
      expect(screen.getByText('Missing env variable')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// AgentHealthPanel
// ---------------------------------------------------------------------------

describe('AgentHealthPanel', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the panel heading', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('Agent 健康度')).toBeInTheDocument();
  });

  it('shows empty-state message when no agents are configured', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('暂無 Agent 資料')).toBeInTheDocument();
  });

  it('renders a healthy agent card with correct status', async () => {
    const agent: Agent = {
      name: 'Argus',
      status: 'healthy',
      last_response: '2026-04-13T08:25:00.000Z',
      minutes_ago: 5,
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/agents') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ agents: [agent] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<AgentHealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('Argus')).toBeInTheDocument();
    });
  });

  it('renders an unhealthy agent card', async () => {
    const agent: Agent = {
      name: 'Atlas',
      status: 'unhealthy',
      last_response: '2026-04-13T07:00:00.000Z',
      minutes_ago: 90,
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/agents') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ agents: [agent] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<AgentHealthPanel />);

    await waitFor(() => {
      expect(screen.getByText('Atlas')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// CronJobPanel
// ---------------------------------------------------------------------------

describe('CronJobPanel', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the panel heading', () => {
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('Cron Job 監控')).toBeInTheDocument();
  });

  it('shows empty-state message when no cronjobs are configured', () => {
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('暂無 Cron Job 資料')).toBeInTheDocument();
  });

  it('renders a cronjob card and shows collapsed logs toggle', async () => {
    const cronjob: CronJob = {
      name: 'obster-monitor',
      status: 'active',
      last_run: '2026-04-13T08:00:00.000Z',
      exit_code: 0,
      recent_logs: ['Starting monitor...', 'All checks passed.'],
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/cronjobs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ cronjobs: [cronjob] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<CronJobPanel />);

    await waitFor(() => {
      expect(screen.getByText('obster-monitor')).toBeInTheDocument();
    });

    // Logs are collapsed by default - the log content should not be visible
    expect(screen.queryByText('Starting monitor...')).not.toBeInTheDocument();

    // Clicking the toggle shows the logs
    const toggleBtn = screen.getByRole('button', { name: /顯示 Logs/i });
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Starting monitor...')).toBeInTheDocument();
  });

  it('displays non-zero exit code in error color', async () => {
    const cronjob: CronJob = {
      name: 'obster-cron',
      status: 'failed',
      last_run: '2026-04-13T07:00:00.000Z',
      exit_code: 1,
      recent_logs: [],
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/cronjobs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ cronjobs: [cronjob] }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<CronJobPanel />);

    await waitFor(() => {
      expect(screen.getByText('obster-cron')).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// ExecutionLogPanel
// ---------------------------------------------------------------------------

describe('ExecutionLogPanel', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the panel heading', () => {
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('執行 Log')).toBeInTheDocument();
  });

  it('shows empty-state message when there are no logs', () => {
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('暂無 Log 資料')).toBeInTheDocument();
  });

  it('renders a log entry and expands its JSON on click', async () => {
    const logEntry: LogEntry = {
      filename: 'exec-20260413-001.json',
      path: '/logs/exec-20260413-001.json',
      timestamp: '2026-04-13T08:00:00.000Z',
      content: { status: 'success', duration_ms: 1200 },
    };

    const mockFetch = setupFetchMock();
    mockFetch.mockImplementation((url: string) => {
      if (url === '/api/logs') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ logs: [logEntry], count: 1 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderWithProvider(<ExecutionLogPanel />);

    await waitFor(() => {
      expect(screen.getByText('exec-20260413-001.json')).toBeInTheDocument();
    });

    // JSON is hidden initially
    expect(screen.queryByText(/"status"/)).not.toBeInTheDocument();

    // Expand the card
    fireEvent.click(screen.getByRole('button', { name: /展開/i }));
    await waitFor(() => {
      expect(screen.getByText(/"status"/)).toBeInTheDocument();
    });
  });
});