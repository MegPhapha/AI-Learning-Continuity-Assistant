import Head from 'next/head'
import { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { BookOpen, Home, MessageCircle, Users, FileText, Clipboard, Settings, HelpCircle } from 'react-feather'
import Sidebar from './Sidebar'
import { useLanguage } from './LanguageContext'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

const mobileLinkDefs: { href: string; label: [string, string]; icon: typeof Home }[] = [
  { href: '/', label: ['Role', 'Rôle'], icon: Home },
  { href: '/student', label: ['Chat', 'Chat'], icon: MessageCircle },
  { href: '/teacher', label: ['Teacher', 'Enseignant'], icon: Users },
  { href: '/documents', label: ['Docs', 'Docs'], icon: FileText },
  { href: '/assignments', label: ['Targets', 'Devoirs'], icon: Clipboard },
  { href: '/settings', label: ['Settings', 'Réglages'], icon: Settings },
  { href: '/help', label: ['Help', 'Aide'], icon: HelpCircle },
]

function MobileNav() {
  const router = useRouter()
  const { language } = useLanguage()
  const fr = language === 'fr'
  const mobileLinks = mobileLinkDefs.map((l) => ({ href: l.href, label: l.label[fr ? 1 : 0], icon: l.icon }))

  return (
    <div className="md:hidden shrink-0 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-slate-800 text-sm">AI Learning</h1>
        </div>
      </div>
      <nav className="relative flex items-center gap-1 px-3 pb-2 overflow-x-auto">
        {mobileLinks.map((link) => {
          const isActive = router.pathname === link.href
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{link.label}</span>
            </Link>
          )
        })}
        {/* Fade hint that the nav scrolls horizontally */}
        <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" aria-hidden="true" />
      </nav>
    </div>
  )
}

export default function Layout({
  children,
  title = 'AI Learning Continuity Assistant',
  description = 'AI-powered learning assistant for students in conflict-affected and underserved communities'
}: LayoutProps) {
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
            {/* Mobile navigation */}
            <MobileNav />

            {children}
          </main>
        </div>
      </div>
    </>
  )
}
