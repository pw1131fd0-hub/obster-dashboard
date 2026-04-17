import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import AgentHealthPanel from '../../components/AgentHealthPanel';
import { setupFetchMock } from '../testUtils';

describe('AgentHealthPanel', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/agents': {
        agents: [
          { name: 'Argus', status: 'healthy', last_seen_minutes_ago: 5 },
          { name: 'Hephaestus', status: 'unhealthy', last_seen_minutes_ago: 45 },
          { name: 'Atlas', status: 'unknown', last_seen_minutes_ago: 0 },
        ],
      },
    });
  });

  it('displays agent names', () => {
    render(<AgentHealthPanel />);
    expect(screen.getByText('Argus')).toBeDefined();
    expect(screen.getByText('Hephaestus')).toBeDefined();
    expect(screen.getByText('Atlas')).toBeDefined();
  });

  it('displays agent status indicators', () => {
    render(<AgentHealthPanel />);
    const agentElements = screen.getAllByText(/m ago$/);
    expect(agentElements.length).toBeGreaterThan(0);
  });

  it('displays minutes ago for each agent', () => {
    render(<AgentHealthPanel />);
    expect(screen.getByText('5m ago')).toBeDefined();
    expect(screen.getByText('45m ago')).toBeDefined();
  });

  it('displays no agents message when list is empty', () => {
    setupFetchMock({
      '/api/agents': { agents: [] },
    });
    render(<AgentHealthPanel />);
    expect(screen.getByText('No agents available')).toBeDefined();
  });
});
