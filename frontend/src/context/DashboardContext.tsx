import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { DashboardState, DashboardData, Project, CronJob, Agent, LogEntry } from '../types';

type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: DashboardData }
  | { type: 'FETCH_ERROR'; error: string };

interface DashboardContextValue extends DashboardState {
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
        lastUpdated: new Date(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const refreshRef = useRef<() => void>(() => {});

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

      const [projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${baseUrl}/projects`),
        fetch(`${baseUrl}/cronjobs`),
        fetch(`${baseUrl}/agents`),
        fetch(`${baseUrl}/logs`),
      ]);

      const [projectsData, cronjobsData, agentsData, logsData] = await Promise.all([
        projectsRes.ok ? projectsRes.json() : { projects: [] },
        cronjobsRes.ok ? cronjobsRes.json() : { cronjobs: [] },
        agentsRes.ok ? agentsRes.json() : { agents: [] },
        logsRes.ok ? logsRes.json() : { logs: [] },
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: (projectsData as { projects: Project[] }).projects || [],
          cronjobs: (cronjobsData as { cronjobs: CronJob[] }).cronjobs || [],
          agents: (agentsData as { agents: Agent[] }).agents || [],
          logs: (logsData as { logs: LogEntry[] }).logs || [],
        },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err.message : 'Failed to fetch data' });
    }
  }, []);

  refreshRef.current = fetchData;

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      refreshRef.current();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const refresh = useCallback(() => {
    refreshRef.current();
  }, []);

  return (
    <DashboardContext.Provider value={{ ...state, refresh }}>
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