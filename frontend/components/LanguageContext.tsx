'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Language = 'en' | 'fr'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
})

/**
 * Global language state shared by the sidebar, mobile nav, and pages.
 * Persisted to localStorage and applied to <html lang> for screen readers.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('app-language')
      if (saved === 'fr' || saved === 'en') setLanguageState(saved)
    } catch {
      // storage unavailable — default English
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem('app-language', language)
    } catch {
      // ignore
    }
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageState }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
