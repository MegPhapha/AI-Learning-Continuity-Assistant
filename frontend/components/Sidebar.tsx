import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, BookOpen, Users, FileText, Clipboard, Settings, HelpCircle } from 'react-feather'
import { useLanguage } from './LanguageContext'
import { useRole } from './RoleContext'

export default function Sidebar() {
  const router = useRouter()
  const { language } = useLanguage()
  const { role } = useRole()
  const fr = language === 'fr'

  // Each role gets its own clean space — no teacher entries inside the
  // student sidebar and vice versa.
  const studentLinks = [
    { name: fr ? 'Discussion élève' : 'Student Chat', href: '/student', icon: BookOpen },
    { name: fr ? 'Mes devoirs & objectifs' : 'My Assignments', href: '/assignments', icon: Clipboard },
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

  // While no role is active (role selection screen), keep the navigation
  // neutral — never leak teacher sections into the student view.
  const links = role === 'teacher' ? teacherLinks : role === 'student' ? studentLinks : []

  return (
    <aside className="hidden md:flex w-64 bg-white shadow-lg h-full flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            role === 'teacher' ? 'bg-emerald-600' : 'bg-primary-600'
          }`}>
            <BookOpen className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm">{fr ? 'Apprentissage IA' : 'AI Learning'}</h1>
            <p className="text-xs text-slate-500">{fr ? 'Assistant de continuité' : 'Continuity Assistant'}</p>
          </div>
        </div>
      </div>

      {/* Role badge / demo badge */}
      <div className="px-6 py-3">
        <span
          className={`px-3 py-1 text-xs font-medium rounded-full ${
            role === 'teacher'
              ? 'bg-emerald-100 text-emerald-700'
              : role === 'student'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {role === 'teacher' ? (fr ? 'ESPACE ENSEIGNANT' : 'TEACHER SPACE')
            : role === 'student' ? (fr ? 'ESPACE ÉLÈVE' : 'STUDENT SPACE')
            : fr ? 'MODE DÉMO' : 'DEMO MODE'}
        </span>
      </div>

      {/* Navigation — scoped to the active role */}
      <nav className="flex-1 px-4 py-4 space-y-1" aria-label={fr ? 'Navigation principale' : 'Main navigation'}>
        {links.map((link) => {
          const isActive = router.pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`sidebar-link flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-600 ${
                isActive
                  ? role === 'teacher'
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'bg-primary-50 text-primary-600 font-medium'
                  : 'hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? (role === 'teacher' ? 'text-emerald-600' : 'text-primary-600') : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span>{link.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Switch role */}
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
        <div className="text-xs text-slate-500 space-y-1">
          <p>{fr ? 'Pour les communautés touchées par les conflits et défavorisées' : 'For Conflict-Affected and Underserved Communities'}</p>
          <p className={`font-medium ${role === 'teacher' ? 'text-emerald-600' : 'text-primary-600'}`}>
            {fr ? 'Mali et au-delà' : 'Mali & Beyond'}
          </p>
        </div>
      </div>
    </aside>
  )
}
