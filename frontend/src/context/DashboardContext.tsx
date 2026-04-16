import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { DashboardState, DashboardAction, Project, CronJob, Agent, Log } from '../types';

const initialState: DashboardState = {
  projects: [],
  cronJobs: [],
  agents: [],
  logs: [],
  lastUpdated: null,
  error: null,
  loading: false,
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

const API_BASE = 'http://localhost:3000/api';

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const [projectsRes, cronJobsRes, agentsRes, logsRes] = await Promise.all([
        fetch(`${API_BASE}/projects`).catch(() => null),
        fetch(`${API_BASE}/cronjobs`).catch(() => null),
        fetch(`${API_BASE}/agents`).catch(() => null),
        fetch(`${API_BASE}/logs`).catch(() => null),
      ]);

      const [projects, cronJobs, agents, logs] = await Promise.all([
        projectsRes?.json().catch(() => ({ projects: [] })),
        cronJobsRes?.json().catch(() => ({ cron_jobs: [] })),
        agentsRes?.json().catch(() => ({ agents: [] })),
        logsRes?.json().catch(() => ({ logs: [] })),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: (projects as { projects: Project[] }).projects || [],
          cronJobs: (cronJobs as { cron_jobs: CronJob[] }).cron_jobs || [],
          agents: (agents as { agents: Agent[] }).agents || [],
          logs: (logs as { logs: Log[] }).logs || [],
          lastUpdated: new Date().toISOString(),
        },
      });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err instanceof Error ? err.message : 'Failed to fetch data' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, refresh: fetchData }}>
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
