import { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import type {
  DashboardState,
  DashboardAction,
  ProjectResponse,
  CronJobResponse,
  AgentResponse,
  LogResponse,
} from '../types';

interface DashboardContextType {
  state: DashboardState;
  fetchData: () => Promise<void>;
  refresh: () => Promise<void>;
}

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  config: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        projects: action.payload.projects ?? state.projects,
        cronjobs: action.payload.cronjobs ?? state.cronjobs,
        agents: action.payload.agents ?? state.agents,
        logs: action.payload.logs ?? state.logs,
        config: action.payload.config ?? state.config,
        loading: false,
        lastUpdated: new Date(),
        error: null,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REFRESH_INTERVAL = 30000;

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async (): Promise<void> => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`),
        fetch(`${API_BASE_URL}/cronjobs`),
        fetch(`${API_BASE_URL}/agents`),
        fetch(`${API_BASE_URL}/logs`),
      ]);

      if (!projectsRes.ok || !cronjobsRes.ok || !agentsRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const [projectsData, cronjobsData, agentsData, logsData]: [
        ProjectResponse,
        CronJobResponse,
        AgentResponse,
        LogResponse,
      ] = await Promise.all([
        projectsRes.json() as Promise<ProjectResponse>,
        cronjobsRes.json() as Promise<CronJobResponse>,
        agentsRes.json() as Promise<AgentResponse>,
        logsRes.json() as Promise<LogResponse>,
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: projectsData.projects || [],
          cronjobs: cronjobsData.cronjobs || [],
          agents: agentsData.agents || [],
          logs: logsData.logs || [],
        },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        error: err instanceof Error ? err.message : 'Unknown error occurred',
      });
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);

  useEffect(() => {
    void fetchData();
    const interval = setInterval(() => {
      void fetchData();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, fetchData, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}