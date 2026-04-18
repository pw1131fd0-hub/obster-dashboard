import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import type { DashboardData } from '../types'

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardData> }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }

const initialState: DashboardData = {
  projects: [],
  cronjobs: [],
  agents: [],
  logs: [],
  health: null,
  lastUpdated: null,
  error: null,
  loading: false,
}

function dashboardReducer(state: DashboardData, action: Action): DashboardData {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, error: null }
    case 'FETCH_SUCCESS':
      return { ...state, ...action.payload, lastUpdated: new Date().toLocaleTimeString('zh-TW'), error: null }
    case 'FETCH_ERROR':
      return { ...state, error: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    default:
      return state
  }
}

interface DashboardContextType {
  state: DashboardData
  fetchData: () => Promise<void>
  refresh: () => void
}

const DashboardContext = createContext<DashboardContextType | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const [projects, cronjobs, agents, logs, health] = await Promise.all([
        fetch('/api/projects').then(r => r.json()).catch(() => ({ projects: [] })),
        fetch('/api/cronjobs').then(r => r.json()).catch(() => ({ cronjobs: [] })),
        fetch('/api/agents').then(r => r.json()).catch(() => ({ agents: [] })),
        fetch('/api/logs').then(r => r.json()).catch(() => ({ logs: [] })),
        fetch('/api/health').then(r => r.json()).catch(() => null),
      ])
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          projects: projects.projects || [],
          cronjobs: cronjobs.cronjobs || [],
          agents: agents.agents || [],
          logs: logs.logs || [],
          health,
        },
      })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: String(err) })
    }
  }, [])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <DashboardContext.Provider value={{ state, fetchData, refresh }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used within DashboardProvider')
  return context
}
