import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import CronJobPanel from '../../components/CronJobPanel';
import { setupFetchMock, renderWithProvider } from '../testUtils';

describe('CronJobPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/cronjobs': {
        cronjobs: [
          {
            name: 'obster-monitor',
            status: 'active',
            last_run: '2026-04-17T12:00:00.000Z',
            exit_code: 0,
            recent_logs: ['Process started', 'Task completed successfully'],
          },
          {
            name: 'obster-cron',
            status: 'failed',
            last_run: '2026-04-17T11:50:00.000Z',
            exit_code: 1,
            recent_logs: ['Error: Connection timeout'],
          },
        ],
      },
    });
  });

  it('displays cron job name', () => {
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('obster-monitor')).toBeInTheDocument();
    expect(screen.getByText('obster-cron')).toBeInTheDocument();
  });

  it('displays exit code with correct color', () => {
    renderWithProvider(<CronJobPanel />);
    const exitCodeElements = screen.getAllByText(/Exit Code: \d+/);
    expect(exitCodeElements.length).toBeGreaterThan(0);
  });

  it('displays show logs button when logs exist', () => {
    renderWithProvider(<CronJobPanel />);
    const showLogsButton = screen.getByText('▶ 顯示 Logs');
    expect(showLogsButton).toBeInTheDocument();
  });

  it('displays no cron jobs message when list is empty', () => {
    setupFetchMock({
      '/api/cronjobs': { cronjobs: [] },
    });
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('暂無 Cron Job 資料')).toBeInTheDocument();
  });
});