import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import type { DashboardState, DashboardAction, ProjectResponse, CronJobResponse, AgentResponse, LogResponse } from '../types';

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
        lastUpdated: new Date(),
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

interface DashboardContextValue extends DashboardState {
  fetchData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const REFRESH_INTERVAL = 30000;

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const [projectsData, cronjobsData, agentsData, logsData] = await Promise.all([
        fetchJSON<ProjectResponse>(`${API_BASE_URL}/projects`),
        fetchJSON<CronJobResponse>(`${API_BASE_URL}/cronjobs`),
        fetchJSON<AgentResponse>(`${API_BASE_URL}/agents`),
        fetchJSON<LogResponse>(`${API_BASE_URL}/logs`),
      ]);

      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: projectsData.projects,
          cronjobs: cronjobsData.cronjobs,
          agents: agentsData.agents,
          logs: logsData.logs,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      dispatch({ type: 'FETCH_ERROR', payload: message });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const value: DashboardContextValue = {
    ...state,
    fetchData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
