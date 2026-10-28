'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'
import DocumentCard from '../components/DocumentCard'
import { Document } from '../types'
import { DocumentsAPI, healthCheck } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, Upload, CheckCircle, Clock, XCircle } from 'react-feather'

const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'demo-math',
    name: 'Mathematics Curriculum - Primary Grade 3',
    subject: 'Mathematics',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(Date.now() - 86400000 * 5),
    size: 5000,
    pageCount: 10,
    approvedAt: new Date(Date.now() - 86400000 * 4),
    approvedBy: 'Teacher Demo',
  },
  {
    id: 'demo-science',
    name: 'Science Curriculum - Primary Grade 3',
    subject: 'Science',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(Date.now() - 86400000 * 3),
    size: 8000,
    pageCount: 15,
    approvedAt: new Date(Date.now() - 86400000 * 2),
    approvedBy: 'Teacher Demo',
  },
  {
    id: 'demo-french',
    name: 'French Curriculum - Primary Grade 3',
    subject: 'French',
    grade: 'Grade 3',
    language: 'fr',
    fileType: 'txt',
    status: 'pending',
    uploadedAt: new Date(Date.now() - 86400000),
    size: 10000,
    pageCount: 12,
  },
  {
    id: 'demo-health',
    name: 'Health Education - Primary Grade 3',
    subject: 'Health Education',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(),
    size: 7000,
    pageCount: 8,
    approvedAt: new Date(),
    approvedBy: 'Teacher Demo',
  },
]

type StatusFilter = 'all' | 'approved' | 'pending' | 'rejected'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>(DEMO_DOCUMENTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [backendAvailable, setBackendAvailable] = useState(false)
  const { language, setLanguage } = useLanguage()

  useEffect(() => {
    healthCheck().then(setBackendAvailable)
    if (backendAvailable) {
      DocumentsAPI.getAll().then(setDocuments).catch(console.error)
    }
  }, [backendAvailable])

  const t = (en: string, fr: string) => (language === 'fr' ? fr : en)

  const counts = {
    all: documents.length,
    approved: documents.filter((d) => d.status === 'approved').length,
    pending: documents.filter((d) => d.status === 'pending').length,
    rejected: documents.filter((d) => d.status === 'rejected').length,
  }

  const filteredDocuments = documents.filter((doc) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      doc.name.toLowerCase().includes(query) ||
      doc.subject.toLowerCase().includes(query) ||
      doc.grade.toLowerCase().includes(query)
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filterChips: { key: StatusFilter; label: string; icon?: typeof FileText }[] = [
    { key: 'all', label: t('All', 'Tous') },
    { key: 'approved', label: t('Approved', 'Approuvés'), icon: CheckCircle },
    { key: 'pending', label: t('Pending', 'En attente'), icon: Clock },
    { key: 'rejected', label: t('Rejected', 'Rejetés'), icon: XCircle },
  ]

  return (
    <Layout
      title="Documents - AI Learning Assistant"
      description="View and manage all curriculum documents"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('Documents', 'Documents')}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {t('All your curriculum documents', 'Tous vos documents de programme')}
              <span className="text-slate-400"> · {documents.length} {t('total', 'au total')}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['en', 'fr'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                    language === lang ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Upload */}
            <Link
              href="/teacher"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">{t('Upload', 'Téléverser')}</span>
            </Link>
          </div>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {/* Toolbar: search + status filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div className="relative md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('Search documents...', 'Rechercher des documents...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {filterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setStatusFilter(chip.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                      statusFilter === chip.key
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
                    }`}
                  >
                    {chip.icon && <chip.icon className="w-3.5 h-3.5" />}
                    <span>{chip.label}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md ${
                        statusFilter === chip.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {counts[chip.key]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filteredDocuments.map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DocumentCard
                        id={doc.id}
                        name={doc.name}
                        subject={doc.subject}
                        grade={doc.grade}
                        language={language}
                        status={doc.status}
                        size={`${(doc.size / 1024).toFixed(1)} KB`}
                        pages={doc.pageCount}
                        uploadedAt={doc.uploadedAt}
                        showActions={false}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 py-20 text-center"
              >
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-5" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  {t('No documents found', 'Aucun document trouvé')}
                </h3>
                <p className="text-slate-500">
                  {t(
                    'Try a different search or filter, or upload a new document.',
                    'Essayez une recherche différente ou téléversez un nouveau document.'
                  )}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
