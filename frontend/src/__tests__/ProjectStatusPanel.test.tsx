import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardProvider } from '../context/DashboardContext';
import ProjectStatusPanel from '../components/ProjectStatusPanel';

// Mock fetch
globalThis.fetch = vi.fn();

const mockProjects = [
  {
    name: 'test-project',
    path: '/home/test',
    stage: 'prd' as const,
    iteration: 1,
    quality_score: 90,
    blocking_errors: [],
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    name: 'dev-project',
    path: '/home/dev',
    stage: 'dev' as const,
    iteration: 2,
    quality_score: 75,
    blocking_errors: ['Error: missing module'],
    updated_at: '2024-01-02T00:00:00Z',
  },
];

function renderWithProvider() {
  return render(
    <DashboardProvider>
      <ProjectStatusPanel />
    </DashboardProvider>
  );
}

describe('ProjectStatusPanel', () => {
  it('renders empty state when no projects', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ projects: [] }),
    } as Response);
    renderWithProvider();
    expect(screen.getByText('暂無專案資料')).toBeInTheDocument();
  });

  it('displays stage badges with correct colors', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    } as Response);
    renderWithProvider();
    expect(screen.getByText('prd')).toBeInTheDocument();
    expect(screen.getByText('dev')).toBeInTheDocument();
  });

  it('shows quality score in red when below 85', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    } as Response);
    renderWithProvider();
    const qualityScore = screen.getByText('75');
    expect(qualityScore).toHaveClass('text-error');
  });

  it('displays blocking errors when present', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ projects: mockProjects }),
    } as Response);
    renderWithProvider();
    expect(screen.getByText('Blocking Errors:')).toBeInTheDocument();
    expect(screen.getByText('Error: missing module')).toBeInTheDocument();
  });
});
