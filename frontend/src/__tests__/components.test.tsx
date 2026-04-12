import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectStatusPanel } from '../components/ProjectStatusPanel';
import { AgentHealthPanel } from '../components/AgentHealthPanel';
import { CronJobPanel } from '../components/CronJobPanel';
import { ExecutionLogPanel } from '../components/ExecutionLogPanel';
import { DashboardProvider } from '../context/DashboardContext';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <DashboardProvider>
      {ui}
    </DashboardProvider>
  );
};

describe('ProjectStatusPanel', () => {
  beforeEach(() => mockFetch.mockClear());

  it('renders without crashing', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ projects: [] }) });
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('開發任務狀態')).toBeInTheDocument();
  });

  it('shows "No projects found" when state is empty', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ projects: [] }) });
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });
});

describe('AgentHealthPanel', () => {
  beforeEach(() => mockFetch.mockClear());

  it('renders without crashing', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ agents: [] }) });
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('Agent 健康度')).toBeInTheDocument();
  });

  it('shows 30 minute threshold note', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ agents: [] }) });
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText(/\(30 分鐘未回應 = 異常\)/)).toBeInTheDocument();
  });

  it('shows "No agents configured" when empty', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ agents: [] }) });
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('No agents configured')).toBeInTheDocument();
  });
});

describe('CronJobPanel', () => {
  beforeEach(() => mockFetch.mockClear());

  it('renders without crashing', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ cronjobs: [] }) });
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('Cron Job 監控')).toBeInTheDocument();
  });

  it('shows "No cronjobs configured" when empty', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ cronjobs: [] }) });
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('No cronjobs configured')).toBeInTheDocument();
  });
});

describe('ExecutionLogPanel', () => {
  beforeEach(() => mockFetch.mockClear());

  it('renders without crashing', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ logs: [], count: 0 }) });
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('執行 Log')).toBeInTheDocument();
  });

  it('shows limit note', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ logs: [], count: 0 }) });
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText(/\(最近 20 筆\)/)).toBeInTheDocument();
  });

  it('shows "No execution logs found" when empty', () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ logs: [], count: 0 }) });
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('No execution logs found')).toBeInTheDocument();
  });
});