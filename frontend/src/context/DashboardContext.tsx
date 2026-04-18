import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { Project, CronJob, Agent, LogEntry, DashboardState } from '../types';

type DashboardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardState> }
  | { type: 'FETCH_ERROR'; error: string }
  | { type: 'SET_LAST_UPDATED'; date: Date };

interface DashboardContextType {
  state: DashboardState;
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
      return { ...state, ...action.payload, loading: false, lastUpdated: new Date() };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.error };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.date };
    default:
      return state;
  }
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [healthRes, projectsRes, cronjobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`),
        fetch(`${API_BASE_URL}/projects`),
        fetch(`${API_BASE_URL}/cronjobs`),
        fetch(`${API_BASE_URL}/agents`),
        fetch(`${API_BASE_URL}/logs`),
      ]);

      if (!healthRes.ok || !projectsRes.ok || !cronjobsRes.ok || !agentsRes.ok || !logsRes.ok) {
        throw new Error('API request failed');
      }

      const [health, projects, cronjobs, agents, logs] = await Promise.all([
        healthRes.json(),
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
      dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err.message : 'Unknown error' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, fetchData, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}