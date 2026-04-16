import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { DashboardState, DashboardAction, Project, CronJob, Agent, LogEntry } from '../types';

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
        projects: action.payload.projects,
        cronjobs: action.payload.cronjobs,
        agents: action.payload.agents,
        logs: action.payload.logs,
        lastUpdated: action.payload.lastUpdated,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  refresh: () => void;
  error: string | null;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

async function fetchData(): Promise<Omit<DashboardState, 'loading' | 'error'>> {
  const [projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.allSettled([
    fetch('/api/projects'),
    fetch('/api/cronjobs'),
    fetch('/api/agents'),
    fetch('/api/logs'),
  ]);

  const getJson = async <T,>(res: PromiseSettledResult<Response>, fallback: T): Promise<T> => {
    if (res.status === 'fulfilled' && res.value.ok) {
      return res.value.json();
    }
    return fallback;
  };

  const [projects, cronjobs, agents, logs] = await Promise.all([
    getJson<Project[]>(projectsRes, []),
    getJson<CronJob[]>(cronjobsRes, []),
    getJson<Agent[]>(agentsRes, []),
    getJson<LogEntry[]>(logsRes, []),
  ]);

  return { projects, cronjobs, agents, logs, lastUpdated: new Date() };
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const refresh = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const data = await fetchData();
      dispatch({ type: 'FETCH_SUCCESS', payload: data });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'Unknown error' });
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <DashboardContext.Provider value={{ state, refresh, error: state.error }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
