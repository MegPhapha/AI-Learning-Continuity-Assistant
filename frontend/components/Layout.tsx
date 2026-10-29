import Head from 'next/head'
import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BookOpen, Home, MessageCircle, Users, FileText, Clipboard, Settings, HelpCircle } from 'react-feather'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useLanguage } from './LanguageContext'
import { useRole } from './RoleContext'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

function MobileNav() {
  const router = useRouter()
  const { language } = useLanguage()
  const { role } = useRole()
  const fr = language === 'fr'

  const studentLinks = [
    { href: '/student', label: fr ? 'Chat' : 'Chat', icon: MessageCircle },
    { href: '/help', label: fr ? 'Aide' : 'Help', icon: HelpCircle },
    { href: '/settings', label: fr ? 'Réglages' : 'Settings', icon: Settings },
    { href: '/', label: fr ? 'Rôle' : 'Role', icon: Home },
  ]
  const teacherLinks = [
    { href: '/teacher', label: fr ? 'Ens.' : 'Teacher', icon: Users },
    { href: '/documents', label: fr ? 'Docs' : 'Docs', icon: FileText },
    { href: '/assignments', label: fr ? 'Devoirs' : 'Targets', icon: Clipboard },
    { href: '/settings', label: fr ? 'Réglages' : 'Settings', icon: Settings },
    { href: '/', label: fr ? 'Rôle' : 'Role', icon: Home },
  ]
  // Neutral when no role is chosen — never mix teacher links into the student view
  const mobileLinks = role === 'student' ? studentLinks : role === 'teacher' ? teacherLinks : [studentLinks[3]]

  return (
    <div className="md:hidden shrink-0 bg-white border-b border-slate-200">
      <nav className="relative flex items-center gap-1 px-3 py-2 overflow-x-auto" aria-label="Mobile navigation">
        {mobileLinks.map((link) => {
          const isActive = router.pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href + link.label}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          )
        })}
        {/* Fade hint that the nav scrolls horizontally */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
      </nav>
    </div>
  )
}

function Shell({ children, title, description }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex h-full">
          {/* Sidebar (desktop) */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 flex flex-col h-full min-w-0">
            <TopBar />
            <MobileNav />
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default function Layout(props: LayoutProps) {
  // Language and role are both global (providers live in _app) so navigation
  // never resets them and the sidebar stays in the right role space.
  return <Shell {...props} />
}
