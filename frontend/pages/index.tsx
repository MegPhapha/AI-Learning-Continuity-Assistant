'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Users, ArrowRight, MessageCircle } from 'react-feather'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'
import { useRole } from '../components/RoleContext'

export default function RoleSelectionPage() {
  const { language } = useLanguage()
  const { role, setRole } = useRole()
  const [savedRole, setSavedRole] = useState<'student' | 'teacher' | null>(null)
  const fr = language === 'fr'

  // Read the persisted role once for the "Continue as..." shortcut
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('app-role')
      if (saved === 'student' || saved === 'teacher') setSavedRole(saved)
    } catch {
      // ignore
    }
  }, [])

  const roles = [
    {
      id: 'student' as const,
      name: fr ? 'Élève' : 'Student',
      description: fr
        ? 'Discutez avec le tuteur IA sur vos documents de programme. Posez des questions, entraînez-vous et gagnez des XP !'
        : 'Chat with the AI tutor about your curriculum. Ask questions, practice, and earn XP!',
      cta: fr ? 'Entrer comme élève' : 'Enter as Student',
      href: '/student',
      icon: BookOpen,
      gradient: 'from-primary-500 to-primary-700',
      ring: 'hover:border-primary-400',
      iconBg: 'bg-primary-600',
    },
    {
      id: 'teacher' as const,
      name: fr ? 'Enseignant' : 'Teacher',
      description: fr
        ? 'Gérez les documents de programme, les devoirs, et suivez les progrès de vos élèves.'
        : 'Manage curriculum documents, assignments, and monitor your students\' progress.',
      cta: fr ? 'Entrer comme enseignant' : 'Enter as Teacher',
      href: '/teacher',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-700',
      ring: 'hover:border-emerald-400',
      iconBg: 'bg-emerald-600',
    },
  ]

  return (
    <Layout
      title="AI Learning Continuity Assistant"
      description={fr ? 'Choisissez votre rôle pour continuer' : 'Choose your role to continue'}
    >
      <div className="relative flex-1 flex flex-col items-center justify-center bg-slate-50 px-4 py-6 overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-200">
            <BookOpen className="w-9 h-9 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {fr ? 'Assistant de continuité d\'apprentissage IA' : 'AI Learning Continuity Assistant'}
          </h1>
          <p className="text-slate-500">
            {fr ? 'Choisissez votre rôle pour continuer' : 'Choose your role to continue'}
          </p>
        </div>

        {/* Continue shortcut for a previously chosen role */}
        {savedRole && (
          <Link
            href={savedRole === 'student' ? '/student' : '/teacher'}
            onClick={() => setRole(savedRole)}
            className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-primary-200 text-primary-700 rounded-xl text-sm font-semibold shadow-sm hover:border-primary-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            {fr ? 'Continuer comme' : 'Continue as'} {savedRole === 'student' ? (fr ? 'élève' : 'Student') : fr ? 'enseignant' : 'Teacher'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}

        {/* Role cards — visually distinct */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {roles.map((r) => {
            const Icon = r.icon
            return (
              <Link
                key={r.id}
                href={r.href}
                data-testid={`role-${r.id}`}
                onClick={() => setRole(r.id)}
                className={`group bg-white rounded-2xl shadow-lg border-2 border-slate-200 ${r.ring} p-8 text-left transition-all hover:shadow-xl hover:-translate-y-0.5`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${r.iconBg} flex items-center justify-center mb-6 shadow-md`}
                  aria-hidden="true"
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center">
                  {r.name}
                  <ArrowRight className="w-5 h-5 ml-2 text-slate-300 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </h2>
                <p className="text-slate-500 text-sm mb-4">{r.description}</p>
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white bg-gradient-to-r ${r.gradient}`}
                >
                  {r.cta}
                </span>
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
