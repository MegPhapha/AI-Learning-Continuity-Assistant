'use client'

import { useState, useEffect } from 'react'
import { Clipboard, Plus, X, Target, FileText, Clock, CheckCircle, Trash2, Eye, Users } from 'react-feather'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'
import { translateSubject, translateGrade } from '../lib/i18n'
import { Assignment } from '../types'
import { AssignmentsAPI, healthCheck } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'

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
    submissions: [
      {
        id: 'sub-002',
        studentName: 'Moussa Diallo',
        submittedAt: new Date(),
        response: 'Evaporation: the sun heats water. Condensation: clouds form. Precipitation: rain falls. Collection: water gathers in rivers.',
        reviewed: false,
      },
    ],
  },
]

const SUBJECTS = ['Mathematics', 'Science', 'French', 'Health Education']
const GRADES = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5']

type FilterTab = 'all' | 'daily_target' | 'assignment' | 'review'

export default function AssignmentsPage() {
  const { language } = useLanguage()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [reviewing, setReviewing] = useState<{ assignment: Assignment; submissionIndex: number } | null>(null)

  const t = (en: string, fr: string) => (language === 'fr' ? fr : en)

  // Create form state
  const [form, setForm] = useState({
    type: 'daily_target' as 'daily_target' | 'assignment',
    title: '',
    description: '',
    subject: SUBJECTS[0],
    grade: GRADES[2],
    targetValue: 5,
    dueDate: '',
  })

  // Review form state
  const [reviewForm, setReviewForm] = useState({ feedback: '', grade: '' })

  const load = () => {
    AssignmentsAPI.getAll(undefined, undefined, language)
      .then((data) => setAssignments(data.length ? data : DEMO_ASSIGNMENTS))
      .catch(() => setAssignments(DEMO_ASSIGNMENTS))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    healthCheck().then(setBackendAvailable)
    load()
  }, [language])

  const pendingReviews = assignments.reduce(
    (acc, a) => acc + a.submissions.filter((s) => !s.reviewed).length,
    0
  )
  const activeTargets = assignments.filter((a) => a.type === 'daily_target' && a.status === 'active').length
  const activeAssignments = assignments.filter((a) => a.type === 'assignment' && a.status === 'active').length

  const filtered = assignments.filter((a) => {
    if (filter === 'all') return true
    if (filter === 'review') return a.submissions.some((s) => !s.reviewed)
    return a.type === filter
  })

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return
    try {
      await AssignmentsAPI.create({
        type: form.type,
        title: form.title,
        description: form.description,
        subject: form.subject,
        grade: form.grade,
        targetValue: form.type === 'daily_target' ? form.targetValue : undefined,
        dueDate: form.type === 'assignment' && form.dueDate ? new Date(form.dueDate).toISOString() : null,
      })
      setShowCreateModal(false)
      setForm({ ...form, title: '', description: '', dueDate: '' })
      load()
    } catch {
      // Backend unavailable: add locally so the flow still works
      const local: Assignment = {
        id: `local-${Date.now()}`,
        type: form.type,
        title: form.title,
        description: form.description,
        subject: form.subject,
        grade: form.grade,
        targetValue: form.type === 'daily_target' ? form.targetValue : undefined,
        dueDate: form.type === 'assignment' && form.dueDate ? new Date(form.dueDate) : null,
        status: 'active',
        createdAt: new Date(),
        submissions: [],
      }
      setAssignments((prev) => [local, ...prev])
      setShowCreateModal(false)
      setForm({ ...form, title: '', description: '', dueDate: '' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await AssignmentsAPI.remove(id)
    } catch {
      // ignore — still remove locally
    }
    setAssignments((prev) => prev.filter((a) => a.id !== id))
  }

  const handleReview = async (approved: boolean) => {
    if (!reviewing) return
    const { assignment, submissionIndex } = reviewing
    const submission = assignment.submissions[submissionIndex]
    try {
      await AssignmentsAPI.reviewSubmission(assignment.id, {
        submissionId: submission.id,
        feedback: reviewForm.feedback || undefined,
        grade: reviewForm.grade || undefined,
        approved,
      })
      load()
    } catch {
      // Backend unavailable: apply locally
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id
            ? {
                ...a,
                submissions: a.submissions.map((s, i) =>
                  i === submissionIndex ? { ...s, feedback: reviewForm.feedback, grade: reviewForm.grade, reviewed: true } : s
                ),
              }
            : a
        )
      )
    }
    setReviewing(null)
    setReviewForm({ feedback: '', grade: '' })
  }

  const stats = [
    { label: t('Active Daily Targets', 'Objectifs actifs'), value: activeTargets, icon: Target, color: 'text-amber-600 bg-amber-100' },
    { label: t('Active Assignments', 'Devoirs actifs'), value: activeAssignments, icon: FileText, color: 'text-primary-600 bg-primary-100' },
    { label: t('Pending Reviews', 'Corrections en attente'), value: pendingReviews, icon: Clock, color: 'text-red-600 bg-red-100' },
    { label: t('Total Students', 'Élèves au total'), value: 24, icon: Users, color: 'text-emerald-600 bg-emerald-100' },
  ]

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('All', 'Tous') },
    { key: 'daily_target', label: t('Daily Targets', 'Objectifs') },
    { key: 'assignment', label: t('Assignments', 'Devoirs') },
    { key: 'review', label: t(`Needs Review${pendingReviews ? ` (${pendingReviews})` : ''}`, `À corriger${pendingReviews ? ` (${pendingReviews})` : ''}`) },
  ]

  const formatDate = (d?: string | Date | null) => {
    if (!d) return null
    return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  return (
    <Layout title="Assignments & Daily Targets" description="Set and review student assignments and daily targets">
      <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center">
              <Clipboard className="w-7 h-7 mr-3 text-primary-600" />
              {t('Assignments & Daily Targets', 'Devoirs et objectifs quotidiens')}
            </h1>
            <p className="text-slate-500 text-sm mt-1">Set targets and assignments for your students, then review their work</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Set New</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignment list */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center">
              <Clipboard className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No items here yet. Click &quot;Set New&quot; to create a target or assignment.</p>
            </div>
          )}
          {filtered.map((assignment) => {
            const pending = assignment.submissions.filter((s) => !s.reviewed).length
            return (
              <motion.div
                key={assignment.id}
                layout
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          assignment.type === 'daily_target'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-primary-100 text-primary-700'
                        }`}
                      >
                        {assignment.type === 'daily_target' ? '🎯 Daily Target' : '📄 Assignment'}
                      </span>
                      {assignment.status === 'reviewed' && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                          Reviewed
                        </span>
                      )}
                      {pending > 0 && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                          {pending} awaiting review
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 mt-2">{assignment.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                      <span>{translateSubject(assignment.subject, language)}</span>
                      <span>{translateGrade(assignment.grade, language)}</span>
                      {assignment.targetValue && <span>{t('Target:', 'Objectif :')} {assignment.targetValue}</span>}
                      {formatDate(assignment.dueDate) && <span>{t('Due:', 'Pour le :')} {formatDate(assignment.dueDate)}</span>}
                      <span>{assignment.submissions.length} {t('submission', 'soumission')}{assignment.submissions.length === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {assignment.submissions.some((s) => !s.reviewed) && (
                      <button
                        onClick={() => {
                          const idx = assignment.submissions.findIndex((s) => !s.reviewed)
                          setReviewing({ assignment, submissionIndex: idx })
                          setReviewForm({ feedback: '', grade: '' })
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(assignment.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Reviewed submissions summary */}
                {assignment.submissions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    {assignment.submissions.map((s, i) => (
                      <div key={s.id} className="flex items-start space-x-2 text-sm">
                        {s.reviewed ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <span className="font-medium text-slate-700">{s.studentName}</span>
                        <span className="text-slate-400 text-xs">
                          {t(s.reviewed ? `Reviewed${s.grade ? ` — ${s.grade}` : ''}` : 'Awaiting review', s.reviewed ? `Corrigé${s.grade ? ` — ${s.grade}` : ''}` : 'À corriger')}
                        </span>
                        {s.feedback && (
                          <span className="text-slate-500 text-xs truncate flex-1 text-right">“{s.feedback}”</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800">Set a New Target or Assignment</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type toggle */}
              <div className="flex space-x-1 mb-4 bg-slate-100 p-1 rounded-xl">
                {(['daily_target', 'assignment'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setForm((f) => ({ ...f, type }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      form.type === type ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {t(type === 'daily_target' ? '🎯 Daily Target' : '📄 Assignment', type === 'daily_target' ? '🎯 Objectif quotidien' : '📄 Devoir')}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder={form.type === 'daily_target' ? 'e.g. Ask 5 math questions' : 'e.g. Explain the water cycle'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Instructions for students</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what students should do..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                    >
                      {SUBJECTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                    <select
                      value={form.grade}
                      onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white"
                    >
                      {GRADES.map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.type === 'daily_target' ? (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target (times per day)</label>
                    <input
                      type="number"
                      min={1}
                      value={form.targetValue}
                      onChange={(e) => setForm((f) => ({ ...f, targetValue: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Due date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                )}
                <button
                  onClick={handleCreate}
                  disabled={!form.title.trim() || !form.description.trim()}
                  className="w-full py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  Create {form.type === 'daily_target' ? 'Daily Target' : 'Assignment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
            onClick={() => setReviewing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Review Submission</h2>
                  <p className="text-sm text-slate-500">{reviewing.assignment.title}</p>
                </div>
                <button onClick={() => setReviewing(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  {reviewing.assignment.submissions[reviewing.submissionIndex].studentName} —{' '}
                  {formatDate(reviewing.assignment.submissions[reviewing.submissionIndex].submittedAt)}
                </p>
                <p className="text-sm text-slate-700">
                  {reviewing.assignment.submissions[reviewing.submissionIndex].response}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Feedback</label>
                  <textarea
                    value={reviewForm.feedback}
                    onChange={(e) => setReviewForm((f) => ({ ...f, feedback: e.target.value }))}
                    placeholder="Tell the student what they did well and how to improve..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <div className="flex space-x-2">
                    {['A', 'B', 'C', 'Needs Work'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setReviewForm((f) => ({ ...f, grade: g }))}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          reviewForm.grade === g
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'border-slate-300 text-slate-600 hover:border-primary-400'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReview(true)}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(false)}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors"
                  >
                    Request Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
