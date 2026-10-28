'use client'

import Link from 'next/link'
import { BookOpen, Users, ArrowRight } from 'react-feather'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'

export default function RoleSelectionPage() {
  const { language, setLanguage } = useLanguage()
  const fr = language === 'fr'

  const roles = [
    {
      name: fr ? 'Élève' : 'Student',
      description: fr
        ? 'Discutez avec le tuteur IA sur vos documents de programme'
        : 'Chat with the AI tutor about your curriculum documents',
      href: '/student',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-700',
      hover: 'hover:scale-[1.02]',
    },
    {
      name: fr ? 'Enseignant' : 'Teacher',
      description: fr
        ? 'Gérez les documents, suivez les élèves et consultez le tableau de bord'
        : 'Manage documents, monitor students, and review the dashboard',
      href: '/teacher',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-700',
      hover: 'hover:scale-[1.02]',
    },
  ]

  return (
    <Layout
      title="AI Learning Continuity Assistant"
      description={fr ? 'Choisissez votre rôle pour continuer' : 'Choose your role to continue'}
    >
      <div className="relative flex-1 flex flex-col items-center justify-center bg-slate-50 px-4 py-6 overflow-y-auto">
        {/* Language toggle */}
        <div className="absolute top-5 right-5">
          <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
            {(['en', 'fr'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                aria-label={lang === 'en' ? 'English' : 'Français'}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  language === lang ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {fr ? 'Assistant de continuité d\'apprentissage IA' : 'AI Learning Continuity Assistant'}
          </h1>
          <p className="text-slate-500">
            {fr ? 'Choisissez votre rôle pour continuer' : 'Choose your role to continue'}
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <Link
                key={role.href}
                href={role.href}
                data-testid={`role-${language === 'fr' ? 'eleve' : 'student'}`}
                className={`group bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-left transition-transform ${role.hover} hover:shadow-xl`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-6`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                  {role.name}
                  <ArrowRight className="w-5 h-5 ml-2 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </h2>
                <p className="text-slate-500 text-sm">{role.description}</p>
              </Link>
            )
          })}
        </div>

        {/* Footer links */}
        <div className="mt-12 text-sm text-slate-400 space-x-6">
          <Link href="/help" className="hover:text-primary-600">
            {fr ? 'Aide' : 'Help'}
          </Link>
          <Link href="/settings" className="hover:text-primary-600">
            {fr ? 'Paramètres' : 'Settings'}
          </Link>
        </div>
      </div>
    </Layout>
  )
}
