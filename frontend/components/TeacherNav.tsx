'use client'

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Users, FileText, Clipboard } from 'react-feather'
import { useLanguage } from './LanguageContext'

/**
 * Secondary navigation for the teacher space — labelled sections instead of
 * one long scrolling page: Dashboard · Documents · Assignments & Targets.
 */
export default function TeacherNav() {
  const router = useRouter()
  const { language } = useLanguage()
  const fr = language === 'fr'

  const sections = [
    { href: '/teacher', label: fr ? 'Tableau de bord' : 'Dashboard', icon: Users },
    { href: '/documents', label: fr ? 'Documents' : 'Documents', icon: FileText },
    { href: '/assignments', label: fr ? 'Devoirs & objectifs' : 'Assignments & Targets', icon: Clipboard },
  ]

  return (
    <nav
      aria-label={fr ? 'Navigation enseignant' : 'Teacher navigation'}
      className="shrink-0 flex items-center gap-1 px-4 sm:px-6 py-2 bg-white border-b border-slate-200 overflow-x-auto"
    >
      {sections.map((s) => {
        const isActive = router.pathname === s.href
        const Icon = s.icon
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} aria-hidden="true" />
            <span>{s.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
