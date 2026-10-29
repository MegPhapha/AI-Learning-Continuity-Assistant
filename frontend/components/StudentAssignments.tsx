'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Target, FileText, Clock, ArrowRight, Award, BookOpen } from 'react-feather'
import { Assignment } from '../types'
import { AssignmentsAPI, healthCheck } from '../lib/api'
import { translateSubject, translateGrade } from '../lib/i18n'
import { DailyStats, levelFor } from './DailyChallenge'

// Demo fallback when the backend is unreachable
const DEMO_ASSIGNMENTS: Assignment[] = [
  {
    id: 'target-math-questions',
    type: 'daily_target',
    title: 'Ask 5 math questions',
    description: 'Ask the AI tutor at least 5 questions about addition and subtraction today.',
    subject: 'Mathematics',
    grade: 'Grade 3',
    targetValue: 5,
    status: 'active',
    createdAt: new Date(),
    submissions: [],
  },
  {
    id: 'assignment-water-cycle',
    type: 'assignment',
    title: 'Draw and explain the water cycle',
    description: 'Draw the four stages of the water cycle and write one sentence explaining each stage.',
    subject: 'Science',
    grade: 'Grade 3',
    dueDate: new Date(),
    status: 'active',
    createdAt: new Date(),
    submissions: [],
  },
]

/**
 * Student view of Assignments & Daily Targets: read-only cards showing what
 * the teacher assigned, with live progress from the student's daily activity.
 */
export default function StudentAssignments({ language }: { language: 'en' | 'fr' }) {
  const fr = language === 'fr'
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<DailyStats | null>(null)

  useEffect(() => {
    AssignmentsAPI.getAll(undefined, undefined, language)
      .then((data) => setAssignments(data.filter((a) => a.status === 'active')))
      .catch(() => setAssignments(DEMO_ASSIGNMENTS.filter((a) => a.status === 'active')))
    try {
      const raw = window.localStorage.getItem('daily-stats')
      if (raw) setStats(JSON.parse(raw) as DailyStats)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  const level = levelFor(stats?.xp ?? 0)
  const questionsToday = stats?.questionsAsked ?? 0
  const practiceToday = stats?.practiceCompleted ?? 0

  const dailyTargets = assignments.filter((a) => a.type === 'daily_target')
  const homework = assignments.filter((a) => a.type === 'assignment')

  const formatDate = (d?: string | Date | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString(fr ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 pb-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🎯 {fr ? 'Mes devoirs et objectifs' : 'My Assignments & Targets'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {fr
              ? `Niveau ${level.level} · ${level.name} · ${stats?.xp ?? 0} XP — continue comme ça !`
              : `Level ${level.level} · ${level.name} · ${stats?.xp ?? 0} XP — keep it up!`}
          </p>
        </div>

        {/* Daily targets — with live progress */}
        <section aria-label={fr ? 'Objectifs du jour' : 'Daily targets'} className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {fr ? 'Objectifs du jour' : 'Daily targets'}
          </h2>
          {dailyTargets.length === 0 && (
            <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-5">
              {fr ? 'Aucun objectif pour aujourd\'hui — bravo si tu as tout terminé !' : 'No targets yet — great job if you finished everything!'}
            </p>
          )}
          <div className="space-y-4">
            {dailyTargets.map((t) => {
              const target = t.targetValue ?? 3
              const progress = Math.min(questionsToday, target)
              const pct = Math.round((progress / target) * 100)
              const complete = progress >= target
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl p-5 border shadow-sm ${complete ? 'border-emerald-300' : 'border-slate-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${complete ? 'bg-emerald-100' : 'bg-primary-100'}`}>
                      {complete ? <Award className="w-5 h-5 text-emerald-600" aria-hidden="true" /> : <Target className="w-5 h-5 text-primary-600" aria-hidden="true" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{t.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{t.description}</p>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {fr ? 'Aujourd\'hui' : 'Today'}: <b className="text-slate-700">{progress}/{target}</b>
                        </span>
                        <span className={complete ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                          {complete ? (fr ? '🎉 Terminé !' : '🎉 Done!') : `${pct}%`}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={target}>
                        <motion.div
                          className={`h-full rounded-full ${complete ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-primary-500'}`}
                          initial={false}
                          animate={{ width: `${pct}%` }}
                          transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Assignments */}
        <section aria-label={fr ? 'Devoirs' : 'Assignments'} className="mb-8">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
            {fr ? 'Devoirs' : 'Assignments'}
          </h2>
          {homework.length === 0 && (
            <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-5">
              {fr ? 'Aucun devoir pour le moment.' : 'No assignments yet.'}
            </p>
          )}
          <div className="space-y-4">
            {homework.map((a) => {
              const due = formatDate(a.dueDate)
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-accent-600" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{a.title}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg">{translateSubject(a.subject, language)}</span>
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-lg">{translateGrade(a.grade, language)}</span>
                        {due && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            {fr ? 'Pour le' : 'Due'} {due}
                          </span>
                        )}
                      </div>
                      <Link
                        href="/student"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-xl hover:bg-primary-700 transition-colors"
                      >
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        {fr ? 'Ouvrir le tuteur' : 'Open the tutor'}
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Encouragement footer */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-5 text-white flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-bold">{fr ? 'Chaque question te rapproche du niveau suivant !' : 'Every question brings you closer to the next level!'}</p>
            <p className="text-sm opacity-90 mt-0.5">
              {fr ? `${practiceToday} activité(s) pratique(s) terminée(s) aujourd'hui` : `${practiceToday} practice activit${practiceToday === 1 ? 'y' : 'ies'} completed today`}
            </p>
          </div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-primary-600 rounded-xl font-medium hover:bg-slate-100 transition-colors"
          >
            {fr ? 'Continuer d\'apprendre' : 'Keep learning'}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  )
}
