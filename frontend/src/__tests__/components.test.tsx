import { render, screen } from '@testing-library/react';
import { ProjectStatusPanel } from '../components/ProjectStatusPanel';
import { DashboardProvider } from '../context/DashboardContext';
import { DashboardState } from '../types';

// Test setup helper
const renderWithProvider = (ui: React.ReactElement, initialState?: DashboardState) => {
  return render(
    <DashboardProvider>
      {ui}
    </DashboardProvider>
  );
};

describe('ProjectStatusPanel', () => {
  it('renders without crashing', () => {
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('開發任務狀態')).toBeInTheDocument();
  });

  it('shows "No projects found" when state is empty', () => {
    renderWithProvider(<ProjectStatusPanel />);
    expect(screen.getByText('No projects found')).toBeInTheDocument();
  });
});

describe('AgentHealthPanel', () => {
  it('renders without crashing', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('Agent 健康度')).toBeInTheDocument();
  });

  it('shows 30 minute threshold note', () => {
    renderWithProvider(<AgentHealthPanel />);
    expect(screen.getByText('30 分鐘未回應 = 異常')).toBeInTheDocument();
  });
});

describe('CronJobPanel', () => {
  it('renders without crashing', () => {
    renderWithProvider(<CronJobPanel />);
    expect(screen.getByText('Cron Job 監控')).toBeInTheDocument();
  });
});

describe('ExecutionLogPanel', () => {
  it('renders without crashing', () => {
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('執行 Log')).toBeInTheDocument();
  });

  it('shows limit note', () => {
    renderWithProvider(<ExecutionLogPanel />);
    expect(screen.getByText('最近 20 筆')).toBeInTheDocument();
  });
});