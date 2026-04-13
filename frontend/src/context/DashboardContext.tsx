import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { DashboardState, DashboardAction, Project, CronJob, Agent, LogEntry } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface DashboardContextType extends DashboardState {
  fetchData: () => Promise<void>;
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

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
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

      const [projectsData, cronjobsData, agentsData, logsData] = await Promise.all([
        projectsRes.json().catch(() => ({ projects: [] })),
        cronjobsRes.json().catch(() => ({ cronjobs: [] })),
        agentsRes.json().catch(() => ({ agents: [] })),
        logsRes.json().catch(() => ({ logs: [] })),
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
      dispatch({
        type: 'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to fetch data',
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
    <DashboardContext.Provider value={{ ...state, fetchData, refresh }}>
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
