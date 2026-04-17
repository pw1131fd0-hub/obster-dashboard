import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type {
  DashboardState,
  DashboardAction,
  Project,
  CronJob,
  Agent,
  ExecutionLog,
  ProjectResponse,
  CronJobResponse,
  AgentResponse,
  LogResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REFRESH_INTERVAL = 30000;

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
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
        loading: false,
        ...action.payload,
        lastUpdated: new Date().toISOString(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface DashboardContextValue extends DashboardState {
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
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
        throw new Error('Failed to fetch data from API');
      }

      const [projectsData, cronjobsData, agentsData, logsData]: [
        ProjectResponse,
        CronJobResponse,
        AgentResponse,
        LogResponse,
      ] = await Promise.all([
        projectsRes.json(),
        cronjobsRes.json(),
        agentsRes.json(),
        logsRes.json(),
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
    } catch (error) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const value: DashboardContextValue = {
    ...state,
    refresh,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
