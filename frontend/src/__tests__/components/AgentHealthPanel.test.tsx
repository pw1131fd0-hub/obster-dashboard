import { screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import AgentHealthPanel from '../../components/AgentHealthPanel';
import { setupFetchMock, renderWithProvider } from '../testUtils';

describe('AgentHealthPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/agents': {
        agents: [
          { name: 'Argus', status: 'healthy', last_response: '2026-04-17T12:00:00.000Z', minutes_ago: 5 },
          { name: 'Hephaestus', status: 'unhealthy', last_response: '2026-04-17T10:00:00.000Z', minutes_ago: 45 },
          { name: 'Atlas', status: 'unknown', last_response: null, minutes_ago: null },
        ],
      },
    });
  });

  it('displays agent names', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('Argus')).toBeInTheDocument();
    expect(screen.getByText('Hephaestus')).toBeInTheDocument();
    expect(screen.getByText('Atlas')).toBeInTheDocument();
  });

  it('displays agent status indicators', () => {
    renderWithProvider(<AgentHealthPanel />);
    const statusElements = screen.getAllByText(/(healthy|unhealthy|unknown)/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('displays minutes ago for each agent', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('5 min ago')).toBeInTheDocument();
    expect(screen.getByText('45 min ago')).toBeInTheDocument();
  });

  it('displays no response data message when list is empty', () => {
    setupFetchMock({
      '/api/agents': { agents: [] },
    });
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('暂無 Agent 資料')).toBeInTheDocument();
  });
});