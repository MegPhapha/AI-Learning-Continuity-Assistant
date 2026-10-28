'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Role = 'student' | 'teacher'

interface RoleContextValue {
  role: Role | null
  setRole: (role: Role) => void
  clearRole: () => void
}

const RoleContext = createContext<RoleContextValue>({
  role: null,
  setRole: () => {},
  clearRole: () => {},
})

/**
 * Global role state (Student / Teacher). Persisted to localStorage so the
 * navigation and header reflect the chosen role across pages.
 */
export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('app-role')
      if (saved === 'student' || saved === 'teacher') setRoleState(saved)
    } catch {
      // storage unavailable
    }
  }, [])

  const setRole = (r: Role) => {
    setRoleState(r)
    try {
      window.localStorage.setItem('app-role', r)
    } catch {
      // ignore
    }
  }

  const clearRole = () => {
    setRoleState(null)
    try {
      window.localStorage.removeItem('app-role')
    } catch {
      // ignore
    }
  }

  return (
    <RoleContext.Provider value={{ role, setRole, clearRole }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
