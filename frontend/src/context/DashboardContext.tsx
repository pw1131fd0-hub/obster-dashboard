import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type { DashboardState, DashboardAction, Project, CronJob, Agent, LogEntry, ConfigResponse } from '../types';

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
  config: null,
  loading: true,
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
      return { ...state, loading: false, error: action.error };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: new Date() };
    default:
      return state;
  }
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const REFRESH_INTERVAL = 30000;

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' });

    try {
      const [projectsRes, cronjobsRes, agentsRes, logsRes, configRes] = await Promise.allSettled([
        fetch('/api/projects'),
        fetch('/api/cronjobs'),
        fetch('/api/agents'),
        fetch('/api/logs'),
        fetch('/api/config'),
      ]);

      const results: Partial<{
        projects: Project[];
        cronjobs: CronJob[];
        agents: Agent[];
        logs: LogEntry[];
        config: ConfigResponse;
      }> = {};

      if (projectsRes.status === 'fulfilled' && projectsRes.value.ok) {
        const data = await projectsRes.value.json();
        results.projects = data.projects || [];
      }

      if (cronjobsRes.status === 'fulfilled' && cronjobsRes.value.ok) {
        const data = await cronjobsRes.value.json();
        results.cronjobs = data.cronjobs || [];
      }

      if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
        const data = await agentsRes.value.json();
        results.agents = data.agents || [];
      }

      if (logsRes.status === 'fulfilled' && logsRes.value.ok) {
        const data = await logsRes.value.json();
        results.logs = data.logs || [];
      }

      if (configRes.status === 'fulfilled' && configRes.value.ok) {
        const data = await configRes.value.json();
        results.config = data;
      }

      dispatch({ type: 'FETCH_SUCCESS', payload: results });
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', error: err instanceof Error ? err.message : 'Failed to fetch data' });
    }
  }, []);

  const refresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
  }, [fetchData]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
