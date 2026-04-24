import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import ProjectStatusPanel from '../../components/ProjectStatusPanel';
import { setupFetchMock, renderWithProvider } from '../testUtils';

describe('ProjectStatusPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/projects': {
        projects: [
          {
            name: 'obster-dashboard',
            path: '/home/crawd_user/project/obster-dashboard',
            stage: 'dev',
            iteration: 3,
            quality_score: 92,
            blocking_errors: [],
            updated_at: '2026-04-13T08:30:00.000Z',
          },
          {
            name: 'obster-worker',
            path: '/home/crawd_user/project/obster-worker',
            stage: 'prd',
            iteration: 5,
            quality_score: 78,
            blocking_errors: ['Auth module timeout'],
            updated_at: '2026-04-12T10:00:00.000Z',
          },
        ],
      },
    });
  });

  it('displays project name when projects exist', () => {
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('obster-dashboard')).toBeInTheDocument();
    expect(screen.getByText('obster-worker')).toBeInTheDocument();
  });

  it('displays stage badges with correct colors', () => {
    renderWithProvider(<ProjectStatusPanel />);
    const devBadge = screen.getByText('dev');
    const prdBadge = screen.getByText('prd');
    expect(devBadge).toBeInTheDocument();
    expect(prdBadge).toBeInTheDocument();
  });

  it('shows quality score warning when below 85', () => {
    renderWithProvider(<ProjectStatusPanel />);
    const lowScoreElements = screen.getAllByText(/^78$/);
    expect(lowScoreElements.length).toBeGreaterThan(0);
  });

  it('displays no projects message when list is empty', () => {
    setupFetchMock({
      '/api/projects': { projects: [] },
    });
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('暂無專案資料')).toBeInTheDocument();
  });
});