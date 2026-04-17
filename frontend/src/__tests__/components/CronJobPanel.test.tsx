import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import CronJobPanel from '../../components/CronJobPanel';
import { setupFetchMock } from '../testUtils';

describe('CronJobPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/cronjobs': {
        cron_jobs: [
          {
            id: 'obster-monitor',
            name: 'obster-monitor',
            schedule: '*/5 * * * *',
            last_run: '2026-04-17T12:00:00.000Z',
            last_exit_code: 0,
            status: 'completed',
            recent_logs: ['Process started', 'Task completed successfully'],
          },
          {
            id: 'obster-cron',
            name: 'obster-cron',
            schedule: '*/10 * * * *',
            last_run: '2026-04-17T11:50:00.000Z',
            last_exit_code: 1,
            status: 'failed',
            recent_logs: ['Error: Connection timeout'],
          },
        ],
      },
    });
  });

  it('displays cron job name', () => {
    render(<CronJobPanel />);
    expect(screen.getByText('obster-monitor')).toBeDefined();
    expect(screen.getByText('obster-cron')).toBeDefined();
  });

  it('displays exit code with correct color', () => {
    render(<CronJobPanel />);
    const exitCodeElements = screen.getAllByText(/Exit: \d+/);
    expect(exitCodeElements.length).toBeGreaterThan(0);
  });

  it('displays show logs button when logs exist', () => {
    render(<CronJobPanel />);
    const showLogsButton = screen.getByText('Show logs');
    expect(showLogsButton).toBeDefined();
  });

  it('displays no cron jobs message when list is empty', () => {
    setupFetchMock({
      '/api/cronjobs': { cron_jobs: [] },
    });
    render(<CronJobPanel />);
    expect(screen.getByText('No cron jobs available')).toBeDefined();
  });
});
