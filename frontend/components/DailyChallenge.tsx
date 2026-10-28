'use client'

import { Target, Star, Compass, Award, CheckCircle, Zap } from 'react-feather'
import { motion } from 'framer-motion'

export interface DailyStats {
  date: string
  questionsAsked: number
  practiceCompleted: number
  subjectsExplored: string[]
  xp?: number
}

interface DailyChallengeProps {
  stats: DailyStats
  language?: 'en' | 'fr'
}

interface Task {
  id: string
  icon: typeof Target
  label: string
  target: number
  progress: number
  accent: string
}

const LEVELS = ['Explorer', 'Star Seeker', 'Champion', 'Hero', 'Legend']

/** Level info for a given XP total: index (0-based), name, progress into level */
export function levelFor(xp: number) {
  const levelIndex = Math.min(LEVELS.length - 1, Math.floor(xp / 100))
  return {
    level: levelIndex + 1,
    name: LEVELS[levelIndex],
    xpIntoLevel: xp % 100,
  }
}

export default function DailyChallenge({ stats, language = 'en' }: DailyChallengeProps) {
  const t = language === 'fr'
    ? {
        title: 'Objectifs du jour',
        challenges: 'Défis',
        xp: 'XP',
        level: 'Niveau',
        asked: 'Questions posées',
        practice: 'Activités pratiques terminées',
        subjects: 'Sujets explorés',
        curious: 'Curieux : poser 5 questions',
        explorer: 'Explorateur : étudier 2 matières',
        champion: 'Champion : finir 3 activités pratiques',
        done: 'Terminé !',
      }
    : {
        title: 'Daily Targets',
        challenges: 'Challenges',
        xp: 'XP',
        level: 'Level',
        asked: 'Questions asked',
        practice: 'Practice activities completed',
        subjects: 'Subjects explored',
        curious: 'Curious Mind: ask 5 questions',
        explorer: 'Subject Explorer: study 2 subjects',
        champion: 'Practice Champion: finish 3 practice activities',
        done: 'Done!',
      }

  const xp = stats.xp ?? 0
  const levelIndex = Math.min(LEVELS.length - 1, Math.floor(xp / 100))
  const levelName = LEVELS[levelIndex]
  const xpIntoLevel = xp % 100
  const levelProgress = xpIntoLevel

  const targets: Task[] = [
    { id: 'ask', icon: Target, label: t.asked, target: 3, progress: stats.questionsAsked, accent: 'bg-primary-600' },
    { id: 'practice', icon: CheckCircle, label: t.practice, target: 2, progress: stats.practiceCompleted, accent: 'bg-emerald-600' },
  ]

  const challenges: Task[] = [
    { id: 'curious', icon: Star, label: t.curious, target: 5, progress: stats.questionsAsked, accent: 'bg-amber-500' },
    { id: 'explorer', icon: Compass, label: t.explorer, target: 2, progress: stats.subjectsExplored.length, accent: 'bg-sky-600' },
    { id: 'champion', icon: Award, label: t.champion, target: 3, progress: stats.practiceCompleted, accent: 'bg-accent-600' },
  ]

  const renderProgress = (task: Task) => {
    const pct = Math.min(100, Math.round((task.progress / task.target) * 100))
    const complete = task.progress >= task.target
    return (
      <div key={task.id} className="min-w-[160px] flex-1">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`flex items-center gap-1 ${complete ? 'text-emerald-600 font-medium' : 'text-slate-600'}`}>
            <task.icon className="w-3.5 h-3.5" />
            <span>{task.label}</span>
          </span>
          <span className={complete ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
            {complete ? `🎉 ${t.done}` : `${Math.min(task.progress, task.target)}/${task.target}`}
          </span>
        </div>
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${complete ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : task.accent}`}
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 15 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 mx-2 sm:mx-0 mt-2 sm:mt-0">
      {/* XP header */}
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          animate={{ rotate: [0, -8, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0"
        >
          <Zap className="w-5 h-5 text-white" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-slate-700">
              {t.level} {levelIndex + 1} · <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{levelName}</span>
            </span>
            <span className="font-bold text-amber-600">{xp} {t.xp} ⭐</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400"
              initial={false}
              animate={{ width: `${levelProgress}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 16 }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col lg:flex-row lg:items-start gap-3 lg:gap-4 mt-3">
        {/* Daily Targets */}
        <div className="flex-1">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🎯 {t.title}</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {targets.map(renderProgress)}
          </div>
        </div>

        {/* Challenges */}
        <div className="flex-1 lg:border-l lg:pl-4 border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">🏆 {t.challenges}</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            {challenges.map(renderProgress)}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
