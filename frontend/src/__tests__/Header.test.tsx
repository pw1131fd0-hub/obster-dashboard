import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { Header } from '../components/Header';
import { setupFetchMock, renderWithProvider } from './testUtils';

describe('Header', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the dashboard title', () => {
    renderWithProvider(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('OpenClaw Dashboard')).toBeInTheDocument();
  });

  it('shows "Never" when there is no lastRefresh timestamp', () => {
    renderWithProvider(<Header />);
    expect(screen.getByText('Never')).toBeInTheDocument();
  });

  it('renders the refresh button and can be clicked', () => {
    renderWithProvider(<Header />);
    const btn = screen.getByRole('button', { name: /Refresh/i });
    expect(btn).toBeInTheDocument();
    // Clicking should not throw
    fireEvent.click(btn);
  });

  it('shows the auto-refresh indicator text', () => {
    renderWithProvider(<Header />);
    expect(screen.getByText(/Auto-refresh every 30 seconds/)).toBeInTheDocument();
  });
});
