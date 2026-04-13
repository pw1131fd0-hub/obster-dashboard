import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardProvider } from '../context/DashboardContext';
import { ErrorBanner } from '../components/ErrorBanner';

/** Renders ErrorBanner inside a provider whose fetch always rejects,
 *  causing DashboardProvider to dispatch SET_ERROR naturally. */
function renderWithFailingFetch() {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
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
    // Fetch never resolves, so SET_DATA / SET_ERROR are never dispatched —
    // the initial state has error: null so ErrorBanner should render nothing.
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
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/Failed to fetch dashboard data/)).toBeInTheDocument();
  });

  it('renders Retry and Dismiss buttons when an error is shown', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dismiss/i })).toBeInTheDocument();
  });

  it('hides the banner when Dismiss is clicked', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: /Dismiss/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
