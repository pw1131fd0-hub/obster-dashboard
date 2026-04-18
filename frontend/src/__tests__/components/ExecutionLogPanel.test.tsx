import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ExecutionLogPanel } from '../../components/ExecutionLogPanel';
import { setupFetchMock } from '../testUtils';

describe('ExecutionLogPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/logs': {
        logs: [
          {
            filename: 'exec-20260417-001.json',
            path: '/home/crawd_user/.openclaw/workspace/logs/executions/exec-20260417-001.json',
            timestamp: '2026-04-17T12:00:00.000Z',
            content: { execution_id: 'exec-001', status: 'success' },
          },
          {
            filename: 'exec-20260417-002.json',
            path: '/home/crawd_user/.openclaw/workspace/logs/executions/exec-20260417-002.json',
            timestamp: '2026-04-17T11:55:00.000Z',
            content: { execution_id: 'exec-002', status: 'failed', error: 'timeout' },
          },
        ],
        count: 2,
      },
    });
  });

  it('displays log filenames', () => {
    render(<ExecutionLogPanel />);
    expect(screen.getByText('exec-20260417-001.json')).toBeInTheDocument();
    expect(screen.getByText('exec-20260417-002.json')).toBeInTheDocument();
  });

  it('displays timestamps', () => {
    render(<ExecutionLogPanel />);
    expect(screen.getByText(/2026\/4\/17/)).toBeInTheDocument();
  });

  it('displays expand/collapse buttons', () => {
    render(<ExecutionLogPanel />);
    const expandButtons = screen.getAllByText('Expand');
    expect(expandButtons.length).toBeGreaterThan(0);
  });

  it('displays no logs message when list is empty', () => {
    setupFetchMock({
      '/api/logs': { logs: [], count: 0 },
    });
    render(<ExecutionLogPanel />);
    expect(screen.getByText('No logs found')).toBeInTheDocument();
  });
});
