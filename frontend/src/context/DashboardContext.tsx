import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { DashboardState, DashboardAction } from '../types';

const initialState: DashboardState = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  lastRefresh: null,
  error: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.payload, lastRefresh: new Date().toISOString(), error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const fetchData = useCallback(async () => {
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
        type: 'SET_DATA',
        payload: {
          projects: projects.projects || [],
          cronjobs: cronjobs.cronjobs || [],
          agents: agents.agents || [],
          logs: logs.logs || [],
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch dashboard data' });
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <DashboardContext.Provider value={{ state, dispatch, refresh: fetchData }}>
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