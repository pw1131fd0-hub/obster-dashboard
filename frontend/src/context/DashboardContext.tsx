import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { DashboardData } from '../types'

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Partial<DashboardData> }
  | { type: 'FETCH_ERROR'; payload: string }

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
      return { ...state, error: null, loading: true }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        ...action.payload,
        lastUpdated: new Date().toLocaleTimeString('zh-TW'),
        error: null,
        loading: false,
      }
    case 'FETCH_ERROR':
      return { ...state, error: action.payload, loading: false }
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

const REFRESH_INTERVAL = 30000

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const intervalRef = useRef<number | null>(null)
  const refreshRef = useRef<() => void>(() => {})

  const fetchData = useCallback(async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const [projectsRes, cronjobsRes, agentsRes, logsRes, healthRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/cronjobs'),
        fetch('/api/agents'),
        fetch('/api/logs'),
        fetch('/api/health'),
      ])

      const [projects, cronjobs, agents, logs, health] = await Promise.all([
        projectsRes.json().catch(() => ({ projects: [] })),
        cronjobsRes.json().catch(() => ({ cronjobs: [] })),
        agentsRes.json().catch(() => ({ agents: [] })),
        logsRes.json().catch(() => ({ logs: [], count: 0 })),
        healthRes.json().catch(() => null),
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
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
    }
    fetchData()
    intervalRef.current = window.setInterval(fetchData, REFRESH_INTERVAL)
  }, [fetchData])

  refreshRef.current = refresh

  useEffect(() => {
    fetchData()
    intervalRef.current = window.setInterval(fetchData, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
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