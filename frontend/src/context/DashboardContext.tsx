import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { DashboardState, Project, CronJob, Agent, LogEntry } from '../types';

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { projects: Project[]; cronjobs: CronJob[]; agents: Agent[]; logs: LogEntry[] } }
  | { type: 'FETCH_ERROR'; error: string };

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

function dashboardReducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        ...action.payload,
        lastUpdated: new Date(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

interface DashboardContextValue {
  state: DashboardState;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/cronjobs'),
        fetch('/api/agents'),
        fetch('/api/logs'),
      ]);
      const [projects, cronjobs, agents, logs] = await Promise.all([
        projectsRes.json(),
        cronjobsRes.json(),
        agentsRes.json(),
        logsRes.json(),
      ]);
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: projects.projects || [],
          cronjobs: cronjobs.cronjobs || [],
          agents: agents.agents || [],
          logs: logs.logs || [],
        },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', error: (err as Error).message });
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
    <DashboardContext.Provider value={{ state, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
}
