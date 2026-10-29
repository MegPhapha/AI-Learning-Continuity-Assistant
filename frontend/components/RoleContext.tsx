'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Role = 'student' | 'teacher'

interface RoleContextValue {
  role: Role | null
  /** True once the persisted role (if any) has been restored from localStorage */
  loaded: boolean
  setRole: (role: Role) => void
  clearRole: () => void
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  loaded: false,
  setRole: () => {},
  clearRole: () => {},
})

/**
 * Global role state (Student / Teacher). Persisted to localStorage so the
 * navigation and header reflect the chosen role across pages. `loaded`
 * tells consumers when the persisted value has been restored, so pages
 * never guess (and never overwrite) the role before it is known.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('app-role')
      if (saved === 'student' || saved === 'teacher') setRoleState(saved)
    } catch {
      // storage unavailable
    } finally {
      setLoaded(true)
    }
  }, [])

  const setRole = (r: Role) => {
    setRoleState(r)
    setLoaded(true)
    try {
      window.localStorage.setItem('app-role', r)
    } catch {
      // ignore
    }
  }

  const clearRole = () => {
    setRoleState(null)
    setLoaded(true)
    try {
      window.localStorage.removeItem('app-role')
    } catch {
      // ignore
    }
  }

  return (
    <RoleContext.Provider value={{ role, loaded, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
