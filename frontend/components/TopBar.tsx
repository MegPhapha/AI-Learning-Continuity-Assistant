'use client'

import { Globe } from 'react-feather'
import { useLanguage } from './LanguageContext'
import { useRole } from './RoleContext'

/**
 * Slim global header shown on every page (main area, next to the sidebar):
 * left = app/role identity, right = the persistent EN/FR pill.
 */
export default function TopBar() {
  const { language, setLanguage } = useLanguage()
  const { role } = useRole()
  const fr = language === 'fr'

  return (
    <header className="shrink-0 flex items-center justify-between gap-3 bg-white border-b border-slate-200 px-4 sm:px-6 h-12">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm font-bold text-slate-800 truncate">
          {fr ? 'Assistant d\'apprentissage IA' : 'AI Learning Assistant'}
        </span>
        {role && (
          <span
            className={`hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              role === 'student' ? 'bg-primary-100 text-primary-700' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {role === 'student' ? (fr ? 'Élève' : 'Student') : fr ? 'Enseignant' : 'Teacher'}
          </span>
        )}
      </div>

      {/* Persistent EN/FR toggle — the single language control for the whole app */}
      <nav aria-label={fr ? 'Choix de la langue' : 'Language selection'}>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {(['en', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              aria-pressed={language === lang}
              aria-label={lang === 'en' ? 'English' : 'Français'}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                language === lang
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}
