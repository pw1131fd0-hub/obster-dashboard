import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardProvider } from '../context/DashboardContext'
import ProjectStatusPanel from '../components/ProjectStatusPanel'
import type { DashboardData } from '../types'

// Mock fetch
global.fetch = vi.fn()

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
]

function renderWithProvider(mockState: Partial<DashboardData> = {}) {
  const defaultState: DashboardData = {
    projects: [],
    cronjobs: [],
    agents: [],
    logs: [],
    health: null,
    lastUpdated: null,
    error: null,
    loading: false,
    ...mockState,
  }

  return render(
    <DashboardProvider>
      <ProjectStatusPanel />
    </DashboardProvider>
  )
}

describe('ProjectStatusPanel', () => {
  it('renders empty state when no projects', () => {
    renderWithProvider({ projects: [] })
    expect(screen.getByText('暂无專案資料')).toBeInTheDocument()
  })

  it('renders project list correctly', () => {
    renderWithProvider({ projects: mockProjects })

    expect(screen.getByText('test-project')).toBeInTheDocument()
    expect(screen.getByText('/home/test')).toBeInTheDocument()
    expect(screen.getByText('dev-project')).toBeInTheDocument()
  })

  it('displays stage badges with correct colors', () => {
    renderWithProvider({ projects: mockProjects })

    const prdBadge = screen.getByText('prd')
    const devBadge = screen.getByText('dev')

    expect(prdBadge).toHaveClass('bg-blue-500')
    expect(devBadge).toHaveClass('bg-yellow-500')
  })

  it('shows quality score in red when below 85', () => {
    renderWithProvider({ projects: mockProjects })

    const qualityScore = screen.getByText('75')
    expect(qualityScore).toHaveClass('text-error')
  })

  it('shows quality score in green when 85 or above', () => {
    renderWithProvider({ projects: mockProjects })

    const qualityScore = screen.getByText('90')
    expect(qualityScore).toHaveClass('text-success')
  })

  it('displays blocking errors when present', () => {
    renderWithProvider({ projects: mockProjects })

    expect(screen.getByText('Blocking Errors:')).toBeInTheDocument()
    expect(screen.getByText('Error: missing module')).toBeInTheDocument()
  })

  it('does not display blocking errors section when none', () => {
    renderWithProvider({ projects: [mockProjects[0]] })

    expect(screen.queryByText('Blocking Errors:')).not.toBeInTheDocument()
  })
})
