import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardProvider } from '../context/DashboardContext';
import ErrorBanner from '../components/ErrorBanner';
import userEvent from '@testing-library/user-event';

function renderWithFailingFetch(message = 'Network failure') {
  globalThis.fetch = vi.fn().mockRejectedValue(new Error(message));
  return render(
    <DashboardProvider>
      <ErrorBanner message={message} onRefresh={vi.fn()} />
    </DashboardProvider>,
  );
}

describe('ErrorBanner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the error message with role="alert" after a fetch failure', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('renders Retry button when an error is shown', async () => {
    renderWithFailingFetch();
    await screen.findByRole('alert');
    expect(screen.getByRole('button', { name: /重新整理/i })).toBeInTheDocument();
  });
});
