'use client'

import React from 'react'
import { FileText, CheckCircle, XCircle, Clock, Eye, Edit, Trash2 } from 'react-feather'
import { motion } from 'framer-motion'
import { translateSubject, translateGrade } from '../lib/i18n'

interface DocumentCardProps {
  id: string
  name: string
  subject?: string
  grade?: string
  language?: 'en' | 'fr'
  status: 'approved' | 'pending' | 'rejected'
  size?: string
  pages?: number
  uploadedAt?: Date | string
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  /** Teacher review actions: approve/reject pending (or re-approve rejected) documents */
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  showActions?: boolean
}

const statusConfig = {
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    label: 'Approved',
    labelFr: 'Approuvé',
  },
  pending: {
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    label: 'Pending',
    labelFr: 'En attente',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    label: 'Rejected',
    labelFr: 'Rejeté',
  },
}

const subjectColors: Record<string, string> = {
  'Mathematics': 'from-violet-500 to-purple-600',
  'Math': 'from-violet-500 to-purple-600',
  'Science': 'from-emerald-500 to-teal-600',
  'French': 'from-rose-500 to-pink-600',
  'Health': 'from-cyan-500 to-blue-600',
  'Health Education': 'from-cyan-500 to-blue-600',
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  id,
  name,
  subject = 'General',
  grade = '',
  language = 'en',
  status,
  size,
  pages,
  uploadedAt,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  showActions = true,
}) => {
  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon
  const subjectColor = subjectColors[subject] || 'from-slate-500 to-slate-600'

  // Dates may arrive as ISO strings from the API or as Date objects from demo data
  const formatDate = (date?: Date | string) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      className={`document-card bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col ${showActions ? 'cursor-pointer' : ''}`}
      onClick={() => onView?.(id)}
    >
      <div className={`h-1.5 bg-gradient-to-r ${subjectColor}`} />

      <div className="p-5 flex-1">
        {/* Title row: icon + title + status */}
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 shrink-0 bg-gradient-to-br ${subjectColor} rounded-xl flex items-center justify-center`}>
            <FileText className="w-5 h-5 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-slate-800 break-words leading-snug">{name}</h3>
          </div>

          <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color} text-xs font-medium`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'fr' ? statusInfo.labelFr : statusInfo.label}</span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-lg">{translateSubject(subject, language)}</span>
          {grade && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-lg">{translateGrade(grade, language)}</span>}
          {language && <span className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-lg">{language.toUpperCase()}</span>}
        </div>
      </div>

      {/* Footer: metadata + actions */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{pages || 1} {language === 'fr' ? 'page' : 'page'}{pages !== 1 ? 's' : ''}</span>
          </div>
          {size && (
            <span className="flex items-center gap-2">
              <span>•</span>
              <span>{size}</span>
            </span>
          )}
          {uploadedAt && (
            <span className="flex items-center gap-2">
              <span>•</span>
              <span>{formatDate(uploadedAt)}</span>
            </span>
          )}
        </div>

        {showActions && (onView || onEdit || onDelete) && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onView && (
              <button
                type="button"
                onClick={() => onView(id)}
                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                title="View"
                aria-label="View"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(id)}
                className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                title="Edit"
                aria-label="Edit"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Teacher review actions: approve / reject non-approved documents */}
        {(onApprove || onReject) && status !== 'approved' && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {onApprove && (
              <button
                type="button"
                onClick={() => onApprove(id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Approuver' : 'Approve'}</span>
              </button>
            )}
            {onReject && status === 'pending' && (
              <button
                type="button"
                onClick={() => onReject(id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Rejeter' : 'Reject'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default DocumentCard
