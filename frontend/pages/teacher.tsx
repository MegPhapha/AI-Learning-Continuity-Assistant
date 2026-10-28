'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, CheckCircle, Clock, XCircle, Plus, Upload, Search, Filter, MoreVertical, Eye, Edit, Trash2, AlertTriangle, Flag, BarChart2, X } from 'react-feather'
import Layout from '../components/Layout'
import TeacherNav from '../components/TeacherNav'
import { useLanguage } from '../components/LanguageContext'
import { useRole } from '../components/RoleContext'
import DocumentCard from '../components/DocumentCard'
import { Document, TeacherStats } from '../types'
import { DocumentsAPI, TeacherAPI, healthCheck } from '../lib/api'
import { motion, AnimatePresence } from 'framer-motion'

// Demo data for when backend is not available
const DEMO_STATS: TeacherStats = {
  totalDocuments: 4,
  approvedDocuments: 3,
  pendingDocuments: 1,
  rejectedDocuments: 0,
  totalChats: 12,
  flaggedResponses: 1,
}

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

const DEMO_FLAGGED = [
  {
    id: 'flag-1',
    response: 'The capital of France is London.',
    flaggedReason: 'Incorrect fact',
    documentId: 'demo-french',
    timestamp: new Date(Date.now() - 3600000),
    verified: false,
  },
]

type TabType = 'dashboard' | 'documents' | 'flagged'

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [stats, setStats] = useState<TeacherStats>(DEMO_STATS)
  const [documents, setDocuments] = useState<Document[]>(DEMO_DOCUMENTS)
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [flaggedResponses, setFlaggedResponses] = useState<any[]>(DEMO_FLAGGED)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const { language, setLanguage } = useLanguage()
  const { setRole } = useRole()

  // This is the teacher space
  useEffect(() => {
    setRole('teacher')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [backendAvailable, setBackendAvailable] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Check backend and load data
  useEffect(() => {
    healthCheck().then(setBackendAvailable)
    
    if (backendAvailable) {
      Promise.all([
        TeacherAPI.getStats(),
        DocumentsAPI.getAll(),
        TeacherAPI.getFlaggedResponses(),
      ]).then(([statsData, docsData, flaggedData]) => {
        setStats(statsData)
        setDocuments(docsData)
        setFlaggedResponses(flaggedData)
      })
    }
  }, [backendAvailable])

  // Filter documents
  useEffect(() => {
    let filtered = documents
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === filterStatus)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.subject.toLowerCase().includes(query) ||
        doc.grade.toLowerCase().includes(query)
      )
    }
    
    setFilteredDocuments(filtered)
  }, [documents, filterStatus, searchQuery])

  const handleApproveDocument = async (id: string) => {
    try {
      const updatedDoc = await DocumentsAPI.updateStatus(id, 'approved')
      setDocuments(documents.map(doc => doc.id === id ? { ...doc, status: 'approved', approvedAt: new Date(), approvedBy: 'Current Teacher' } : doc))
    } catch (error) {
      console.error('Failed to approve document:', error)
    }
  }

  const handleRejectDocument = async (id: string) => {
    try {
      const updatedDoc = await DocumentsAPI.updateStatus(id, 'rejected', 'Needs review')
      setDocuments(documents.map(doc => doc.id === id ? { ...doc, status: 'rejected', rejectedReason: 'Needs review' } : doc))
    } catch (error) {
      console.error('Failed to reject document:', error)
    }
  }

  const handleUpload = async (file: File, subject: string, grade: string) => {
    setUploading(true)
    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subject', subject)
      formData.append('grade', grade)
      formData.append('language', language)
      
      const response = await DocumentsAPI.upload(file, { subject, grade, language })
      
      if (response.document) {
        setDocuments([...documents, response.document])
        setShowUploadModal(false)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const tabs = [
    { id: 'dashboard' as const, label: language === 'fr' ? 'Tableau de bord' : 'Dashboard', icon: BarChart2 },
    { id: 'documents' as const, label: language === 'fr' ? 'Documents' : 'Documents', icon: FileText },
    { id: 'flagged' as const, label: language === 'fr' ? 'Signalements' : 'Flagged', icon: Flag },
  ]

  const statCards = [
    {
      label: language === 'fr' ? 'Documents Totaux' : 'Total Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'primary',
      bgColor: 'bg-primary-50',
    },
    {
      label: language === 'fr' ? 'Approuvés' : 'Approved',
      value: stats.approvedDocuments,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
    },
    {
      label: language === 'fr' ? 'En Attente' : 'Pending',
      value: stats.pendingDocuments,
      icon: Clock,
      color: 'amber',
      bgColor: 'bg-amber-50',
    },
    {
      label: language === 'fr' ? 'Rejetés' : 'Rejected',
      value: stats.rejectedDocuments,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
    },
  ]

  const colorClasses: Record<string, string> = {
    primary: 'text-primary-600 bg-primary-100',
    green: 'text-green-600 bg-green-100',
    amber: 'text-amber-600 bg-amber-100',
    red: 'text-red-600 bg-red-100',
  }

  return (
    <Layout
      title="Teacher Dashboard - AI Learning Assistant"
      description="Teacher dashboard for managing curriculum documents"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        <TeacherNav />
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {language === 'fr' ? 'Tableau de bord de l\'enseignant' : 'Teacher Dashboard'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {language === 'fr' ? 'Gérez vos documents de programme' : 'Manage your curriculum documents'}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Ajouter un document' : 'Add Document'}</span>
                </button>

                {/* Language lives in the global TopBar */}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => {
                      const Icon = stat.icon
                      return (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * statCards.indexOf(stat) }}
                          className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${stat.bgColor}`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                          </div>
                          <h3 className="text-3xl font-bold text-slate-800">{stat.value}</h3>
                          <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-primary-100 rounded-xl">
                          <Upload className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{language === 'fr' ? 'Télécharger' : 'Upload'}</h4>
                          <p className="text-sm text-slate-500">{language === 'fr' ? 'Ajouter de nouveaux documents' : 'Add new documents'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="w-full py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-sm font-medium"
                      >
                        {language === 'fr' ? 'Télécharger un document' : 'Upload Document'}
                      </button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{language === 'fr' ? 'Approuver' : 'Approve'}</h4>
                          <p className="text-sm text-slate-500">{language === 'fr' ? 'Approuver les documents en attente' : 'Approve pending documents'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setFilterStatus('pending')}
                        className="w-full py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-medium"
                      >
                        {language === 'fr' ? 'Voir en attente' : 'View Pending'}
                      </button>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-3 bg-red-100 rounded-xl">
                          <Flag className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800">{language === 'fr' ? 'Signalements' : 'Flagged'}</h4>
                          <p className="text-sm text-slate-500">{language === 'fr' ? 'Vérifier les réponses signalées' : 'Review flagged responses'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('flagged')}
                        className="w-full py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-medium"
                      >
                        {language === 'fr' ? 'Voir les signalements' : 'View Flagged'}
                      </button>
                    </motion.div>
                  </div>

                  {/* Recent Activity */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                  >
                    <h3 className="font-semibold text-slate-800 mb-4">{language === 'fr' ? 'Activité récente' : 'Recent Activity'}</h3>
                    <div className="space-y-3">
                      {documents.slice(0, 5).map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-4 h-4 text-primary-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.subject} - {doc.grade}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doc.status === 'approved' 
                              ? 'bg-green-100 text-green-600'
                              : doc.status === 'pending'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-red-100 text-red-600'
                          }`}>
                            {doc.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'documents' && (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={language === 'fr' ? 'Rechercher des documents...' : 'Search documents...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">{language === 'fr' ? 'Tous' : 'All'}</option>
                        <option value="pending">{language === 'fr' ? 'En attente' : 'Pending'}</option>
                        <option value="approved">{language === 'fr' ? 'Approuvés' : 'Approved'}</option>
                        <option value="rejected">{language === 'fr' ? 'Rejetés' : 'Rejected'}</option>
                      </select>
                      <button
                        onClick={() => {
                          setSearchQuery('')
                          setFilterStatus('all')
                        }}
                        className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                      >
                        {language === 'fr' ? 'Réinitialiser' : 'Reset'}
                      </button>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {filteredDocuments.length > 0 ? (
                        filteredDocuments.map((doc, index) => (
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
                              language="en"
                              status={doc.status}
                              size={`${(doc.size / 1024).toFixed(1)} KB`}
                              pages={doc.pageCount}
                              uploadedAt={doc.uploadedAt}
                              showActions={true}
                            />
                          </motion.div>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="col-span-full text-center py-12"
                        >
                          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                          <p className="text-slate-500">
                            {language === 'fr' ? 'Aucun document trouvé' : 'No documents found'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {activeTab === 'flagged' && (
                <motion.div
                  key="flagged"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Flagged Responses List */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-slate-800">{language === 'fr' ? 'Réponses signalées' : 'Flagged Responses'}</h3>
                      <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-medium rounded-full">
                        {flaggedResponses.length}
                      </span>
                    </div>

                    {flaggedResponses.length > 0 ? (
                      <div className="space-y-4">
                        {flaggedResponses.map((flagged, index) => (
                          <motion.div
                            key={flagged.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-slate-50 rounded-xl border border-slate-200"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <AlertTriangle className="w-5 h-5 text-red-500" />
                                  <span className="font-medium text-slate-800">{language === 'fr' ? 'Problème signalé' : 'Flagged Issue'}</span>
                                </div>
                                <p className="text-slate-600 mb-2">{flagged.response}</p>
                                <p className="text-xs text-slate-500">
                                  {language === 'fr' ? 'Raison : ' : 'Reason: '}{flagged.flaggedReason}
                                </p>
                              </div>
                              <div className="flex space-x-2 ml-4">
                                <button
                                  onClick={() => {
                                    // Dismiss flagged response
                                    setFlaggedResponses(flaggedResponses.filter(f => f.id !== flagged.id))
                                  }}
                                  className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200 transition-all"
                                >
                                  {language === 'fr' ? 'Ignorer' : 'Dismiss'}
                                </button>
                                <button
                                  className="px-3 py-1.5 bg-primary-100 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-200 transition-all"
                                >
                                  {language === 'fr' ? 'Vérifier' : 'Verify'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                      >
                        <Flag className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">
                          {language === 'fr' ? 'Aucune réponse signalée' : 'No flagged responses'}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {language === 'fr' ? 'Tout va bien !' : 'All good!'}
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {language === 'fr' ? 'Télécharger un document' : 'Upload Document'}
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.currentTarget
                const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement
                const subjectInput = form.querySelector('input[name="subject"]') as HTMLInputElement
                const gradeInput = form.querySelector('input[name="grade"]') as HTMLInputElement
                
                if (fileInput?.files?.[0] && subjectInput?.value && gradeInput?.value) {
                  handleUpload(fileInput.files[0], subjectInput.value, gradeInput.value)
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {language === 'fr' ? 'Fichier' : 'File'}
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500">
                  {language === 'fr' ? 'PDF, DOCX, ou TXT uniquement' : 'PDF, DOCX, or TXT only'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === 'fr' ? 'Matière' : 'Subject'}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    placeholder={language === 'fr' ? 'ex: Mathématiques' : 'ex: Mathematics'}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {language === 'fr' ? 'Classe' : 'Grade'}
                  </label>
                  <input
                    type="text"
                    name="grade"
                    placeholder={language === 'fr' ? 'ex: Classe 3' : 'ex: Grade 3'}
                    required
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all font-medium"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'fr' ? 'Téléchargement...' : 'Uploading...'}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>{language === 'fr' ? 'Télécharger' : 'Upload'}</span>
                    </>
                  )}
                </button>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{uploadProgress}%</p>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}

      {/* Demo Mode Notice */}
      {!backendAvailable && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Demo mode - Backend not connected</span>
          </div>
        </div>
      )}
    </Layout>
  )
}
