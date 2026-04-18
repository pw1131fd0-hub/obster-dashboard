import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { DashboardState, Project, CronJob, Agent, ExecutionLog } from '../types';

type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardState> }
  | { type: 'FETCH_ERROR'; payload: string };

interface DashboardContextValue {
  state: DashboardState;
  fetchData: () => void;
  refresh: () => void;
}

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date().toISOString(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const DashboardContext = createContext<DashboardContextValue | undefined>(
  undefined
);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`),
        fetch(`${API_BASE_URL}/cronjobs`),
        fetch(`${API_BASE_URL}/agents`),
        fetch(`${API_BASE_URL}/logs`),
      ]);

      if (!projectsRes.ok || !cronjobsRes.ok || !agentsRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [projectsData, cronjobsData, agentsData, logsData] = await Promise.all([
        projectsRes.json(),
        cronjobsRes.json(),
        agentsRes.json(),
        logsRes.json(),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: (projectsData.projects || []) as Project[],
          cronjobs: (cronjobsData.cronjobs || []) as CronJob[],
          agents: (agentsData.agents || []) as Agent[],
          logs: (logsData.logs || []) as ExecutionLog[],
        },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, fetchData, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
