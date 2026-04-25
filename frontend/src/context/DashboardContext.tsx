import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import {
  DashboardState,
  DashboardAction,
  Project,
  CronJob,
  Agent,
  LogEntry,
  HealthResponse,
} from '../types';

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  health: null,
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
        ...action.payload,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };
    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  fetchData: () => Promise<void>;
  dismissError: () => void;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const refreshIntervalRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const [healthRes, projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/projects'),
        fetch('/api/cronjobs'),
        fetch('/api/agents'),
        fetch('/api/logs?limit=20'),
      ]);

      if (!healthRes.ok || !projectsRes.ok || !cronjobsRes.ok || !agentsRes.ok || !logsRes.ok) {
        throw new Error('Failed to fetch data from one or more endpoints');
      }

      const [health, projects, cronjobs, agents, logs]: [
        HealthResponse,
        { projects: Project[] },
        { cronjobs: CronJob[] },
        { agents: Agent[] },
        { logs: LogEntry[] },
      ] = await Promise.all([
        healthRes.json(),
        projectsRes.json(),
        cronjobsRes.json(),
        agentsRes.json(),
        logsRes.json(),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          health,
          projects: projects.projects || [],
          cronjobs: cronjobs.cronjobs || [],
          agents: agents.agents || [],
          logs: logs.logs || [],
        },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'An unknown error occurred',
      });
    }
  }, []);

  const dismissError = useCallback(() => {
    dispatch({ type: 'FETCH_ERROR', payload: '' });
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchData();
    refreshIntervalRef.current = window.setInterval(fetchData, 30000);

    return () => {
      if (refreshIntervalRef.current !== null) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, fetchData, dismissError }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
