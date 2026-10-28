'use client'

import { CheckCircle, AlertCircle } from 'react-feather'

interface AnswerProvenanceProps {
  verified?: boolean
  language: 'en' | 'fr'
}

/**
 * Visual provenance badge for assistant answers:
 *  - Verified (grounded in curriculum) → solid green treatment with source list handled by the parent
 *  - Unverified (AI fallback) → amber, dashed treatment so students always know which kind of answer they got
 */
export default function AnswerProvenance({ verified, language }: AnswerProvenanceProps) {
  const fr = language === 'fr'
  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        verified
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-dashed border-amber-400'
      }`}
      aria-label={
        verified
          ? fr ? 'Réponse vérifiée à partir du programme' : 'Answer verified from curriculum'
          : fr ? 'Réponse non vérifiée — réponse IA' : 'Not verified from curriculum — AI answer'
      }
    >
      {verified ? (
        <CheckCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      )}
      <span>
        {verified
          ? fr ? 'Vérifié à partir du programme' : 'Verified from curriculum'
          : fr ? 'Non vérifié — réponse IA' : 'Cannot verify — AI answer'}
      </span>
    </div>
  )
}
