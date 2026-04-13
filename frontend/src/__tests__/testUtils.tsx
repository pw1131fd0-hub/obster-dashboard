import React from 'react';
import { vi } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardProvider } from '../context/DashboardContext';

/**
 * URL-aware fetch mock returning empty-state API responses for all four
 * dashboard endpoints.  Call in beforeEach so every test gets a fresh mock.
 */
export function setupFetchMock(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, unknown> = {
    '/api/projects': { projects: [] },
    '/api/cronjobs': { cronjobs: [] },
    '/api/agents':   { agents: [] },
    '/api/logs':     { logs: [], count: 0 },
  };

  const responses = { ...defaults, ...overrides };

  const mockFetch = vi.fn((url: string) => {
    const body = responses[url] ?? {};
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  });

  globalThis.fetch = mockFetch as unknown as typeof fetch;
  return mockFetch;
}

/** Renders a component wrapped in the DashboardProvider context. */
export function renderWithProvider(ui: React.ReactElement) {
  return render(
    <DashboardProvider>{ui}</DashboardProvider>,
  );
}
