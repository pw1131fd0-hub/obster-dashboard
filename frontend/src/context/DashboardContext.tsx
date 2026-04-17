import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { DashboardState, DashboardAction, Project, CronJob, Agent, LogEntry } from '../types';

const initialState: DashboardState = {
  projects: [],
  cronJobs: [],
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
        cronJobs: action.payload.cronJobs,
        agents: action.payload.agents,
        logs: action.payload.logs,
        lastUpdated: action.payload.lastUpdated,
        error: null,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface DashboardContextType {
  state: DashboardState;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REFRESH_INTERVAL = 30000;

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const [projectsRes, cronJobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/projects`).catch(() => null),
        fetch(`${API_BASE_URL}/cronjobs`).catch(() => null),
        fetch(`${API_BASE_URL}/agents`).catch(() => null),
        fetch(`${API_BASE_URL}/logs`).catch(() => null),
      ]);

      const [projectsData, cronJobsData, agentsData, logsData] = await Promise.all([
        projectsRes?.json().catch(() => ({ projects: [] })),
        cronJobsRes?.json().catch(() => ({ cronjobs: [] })),
        agentsRes?.json().catch(() => ({ agents: [] })),
        logsRes?.json().catch(() => ({ logs: [] })),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: (projectsData as { projects: Project[] }).projects || [],
          cronJobs: (cronJobsData as { cronjobs: CronJob[] }).cronjobs || [],
          agents: (agentsData as { agents: Agent[] }).agents || [],
          logs: (logsData as { logs: LogEntry[] }).logs || [],
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (err) {
      dispatch({
        type: 'FETCH_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to fetch data',
      });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, refresh: fetchData }}>
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