import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardProvider } from '../context/DashboardContext';
import { ErrorBanner } from '../components/ErrorBanner';

/** Renders ErrorBanner inside a provider whose fetch always rejects,
 *  causing DashboardProvider to dispatch FETCH_ERROR naturally. */
function renderWithFailingFetch() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
  return render(
    <DashboardProvider>
      <ErrorBanner />
    </DashboardProvider>,
  );
}

describe('ErrorBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when there is no error', () => {
    // Fetch never resolves, so the initial state has error: null
    // ErrorBanner should render nothing.
    globalThis.fetch = vi.fn(() => new Promise(() => { /* never resolves */ }));
    render(
      <DashboardProvider>
        <ErrorBanner />
      </DashboardProvider>,
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the error message with role="alert" after a fetch failure', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
  });

  it('renders Retry button when an error is shown', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
  });
});
