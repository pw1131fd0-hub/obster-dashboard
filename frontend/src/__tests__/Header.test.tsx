import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import Header from '../components/Header';
import { setupFetchMock, renderWithProvider } from './testUtils';

describe('Header', () => {
  beforeEach(() => { setupFetchMock(); });

  it('renders the dashboard title', () => {
    renderWithProvider(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('OpenClaw Dashboard')).toBeInTheDocument();
  });

  it('renders the refresh button and can be clicked', () => {
    renderWithProvider(<Header />);
    const btn = screen.getByRole('button', { name: /重新整理/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
  });

  it('shows the auto-refresh indicator text', () => {
    renderWithProvider(<Header />);
    expect(screen.getByText(/每 30 秒自動刷新/)).toBeInTheDocument();
  });
});
