import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, BookOpen, Users, FileText, Clipboard, Settings, HelpCircle, Flag, Target } from 'react-feather'
import { useLanguage } from './LanguageContext'
import { useRole } from './RoleContext'

export default function Sidebar() {
  const router = useRouter()
  const { language } = useLanguage()
  const { role } = useRole()
  const fr = language === 'fr'

  const studentLinks = [
    { name: fr ? 'Discussion élève' : 'Student Chat', href: '/student', icon: BookOpen },
    { name: fr ? 'Mes objectifs' : 'My Targets', href: '/student', icon: Target },
    { name: fr ? 'Aide' : 'Help', href: '/help', icon: HelpCircle },
    { name: fr ? 'Paramètres' : 'Settings', href: '/settings', icon: Settings },
  ]

  const teacherLinks = [
    { name: fr ? 'Tableau de bord' : 'Dashboard', href: '/teacher', icon: Users },
    { name: fr ? 'Documents' : 'Documents', href: '/documents', icon: FileText },
    { name: fr ? 'Devoirs & objectifs' : 'Assignments & Targets', href: '/assignments', icon: Clipboard },
    { name: fr ? 'Paramètres' : 'Settings', href: '/settings', icon: Settings },
    { name: fr ? 'Aide' : 'Help', href: '/help', icon: HelpCircle },
  ]

  // No role chosen yet (landing page) — show the full set so everything is reachable
  const links = role === 'student' ? studentLinks : role === 'teacher' ? teacherLinks : [...studentLinks.slice(0, 1), ...teacherLinks.slice(0, 3), studentLinks[2], studentLinks[3]]

  return (
    <aside className="hidden md:flex w-64 bg-white shadow-lg h-full flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            role === 'teacher' ? 'bg-emerald-600' : 'bg-primary-600'
          }`}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">{fr ? 'Apprentissage IA' : 'AI Learning'}</h1>
            <p className="text-xs text-slate-500">{fr ? 'Assistant de continuité' : 'Continuity Assistant'}</p>
          </div>
        </div>
      </div>

      {/* Demo Badge */}
      <div className="px-6 py-3">
        <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
          {fr ? 'MODE DÉMO' : 'DEMO MODE'}
        </span>
      </div>

      {/* Navigation — scoped to the active role */}
      <nav className="flex-1 px-4 py-4 space-y-1" aria-label={fr ? 'Navigation principale' : 'Main navigation'}>
        {links.map((link) => {
          const isActive = router.pathname === link.href
          const Icon = link.icon
          const key = link.name
          return (
            <Link
              key={key}
              href={link.href}
              className={`sidebar-link flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} aria-hidden="true" />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Switch role + footer */}
      <div className="px-4 pb-2">
        <Link
          href="/"
          className="sidebar-link flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 border-t border-slate-200 w-full"
        >
          <Home className="w-5 h-5 text-slate-400" aria-hidden="true" />
          <span>{fr ? 'Changer de rôle' : 'Switch Role'}</span>
        </Link>
      </div>

      <div className="p-6 border-t border-slate-200">
        <div className="text-xs text-slate-400 space-y-1">
          <p>{fr ? 'Pour les communautés touchées par les conflits et défavorisées' : 'For Conflict-Affected and Underserved Communities'}</p>
          <p className={`font-medium ${role === 'teacher' ? 'text-emerald-600' : 'text-primary-600'}`}>
            {fr ? 'Mali et au-delà' : 'Mali & Beyond'}
          </p>
        </div>
      </div>
    </aside>
  )
}
