'use client'

import React, { useState, useRef, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { Send, Paperclip, Mic, Trash2, Check, AlertCircle, BookOpen, User, Clock, Eye } from 'react-feather'
import { motion, AnimatePresence } from 'framer-motion'
import AnswerProvenance from './AnswerProvenance'
import ReactMarkdown from 'react-markdown'

// Styled markdown renderers so responses (headings, lists, code, quotes)
// display properly inside chat bubbles and overflow gracefully on mobile.
// `node` is destructured out so it is not leaked onto DOM elements.
const markdownComponents = {
  h1: ({ node, ...p }: any) => <h1 className="text-lg font-bold mt-3 mb-2" {...p} />,
  h2: ({ node, ...p }: any) => <h2 className="text-base font-bold mt-3 mb-2" {...p} />,
  h3: ({ node, ...p }: any) => <h3 className="text-sm font-bold mt-3 mb-1.5" {...p} />,
  p: ({ node, ...p }: any) => <p className="mb-2 last:mb-0 leading-relaxed" {...p} />,
  ul: ({ node, ...p }: any) => <ul className="list-disc pl-5 mb-2 last:mb-0 space-y-1" {...p} />,
  ol: ({ node, ...p }: any) => <ol className="list-decimal pl-5 mb-2 last:mb-0 space-y-1" {...p} />,
  li: ({ node, ...p }: any) => <li className="leading-relaxed break-words" {...p} />,
  strong: ({ node, ...p }: any) => <strong className="font-semibold" {...p} />,
  blockquote: ({ node, ...p }: any) => (
    <blockquote className="border-l-4 border-primary-300 pl-3 my-2 italic text-slate-600" {...p} />
  ),
  a: ({ node, ...p }: any) => <a className="text-primary-600 underline underline-offset-2 break-all" target="_blank" rel="noreferrer" {...p} />,
  hr: () => <hr className="my-3 border-slate-200" />,
  pre: ({ node, ...p }: any) => (
    <pre className="bg-slate-900 text-slate-100 rounded-xl p-3 my-2 overflow-x-auto text-xs leading-relaxed" {...p} />
  ),
  code: ({ node, className, children }: any) =>
    className?.startsWith('language-') ? (
      <code className="font-mono">{children}</code>
    ) : (
      <code className="inline bg-slate-100 text-primary-700 rounded px-1.5 py-0.5 text-[0.85em] font-mono break-all">
        {children}
      </code>
    ),
  table: ({ node, ...p }: any) => (
    <div className="overflow-x-auto my-2">
      <table className="min-w-full text-xs border-collapse border border-slate-200" {...p} />
    </div>
  ),
  th: ({ node, ...p }: any) => <th className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold" {...p} />,
  td: ({ node, ...p }: any) => <td className="border border-slate-200 px-2 py-1" {...p} />,
}
import { translateDocumentName, translateSubject, translateGrade } from '../lib/i18n'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isStreaming?: boolean
  verified?: boolean
  sources?: Array<{ docName: string; page?: number }>
  metadata?: {
    subject?: string
    difficulty?: string
    practiceQuestion?: string
    feedback?: string
    revisionActivity?: string
    graded?: boolean
    correct?: boolean
    awaitingAttempt?: boolean
    model?: string
  }
}

interface ChatPanelProps {
  messages: Message[]
  onSendMessage: (content: string) => void
  isLoading: boolean
  selectedDocument?: { id: string; name: string; subject: string; grade: string }
  onDocumentSelect: (doc: { id: string; name: string; subject: string; grade: string }) => void
  availableDocuments: Array<{ id: string; name: string; subject: string; grade: string }>
  language?: 'en' | 'fr'
  onLanguageChange?: (lang: 'en' | 'fr') => void
  /** Registers which practice question the student is attempting, so the
      server can grade their next message against it */
  onAttemptPractice?: (question: string) => void
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedDocument,
  onDocumentSelect,
  availableDocuments,
  language = 'en',
  onLanguageChange,
  onAttemptPractice,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isComposing, setIsComposing] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll the messages container (not the whole page) so the latest
  // message is visible while the header and input stay in place
  useEffect(() => {
    const el = scrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSend = () => {
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
  }

  const handleDocumentSelect = (doc: { id: string; name: string; subject: string; grade: string }) => {
    onDocumentSelect(doc)
  }

  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat?')) {
      setInputValue('')
      // Clear chat would be handled by parent
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Language strings
  const strings = {
    en: {
      placeholder: 'Type your question here...',
      send: 'Send',
      clearChat: 'Clear Chat',
      noDocument: 'No document selected',
      selectDocument: 'Select a document to start',
      typing: 'AI is thinking...',
      verified: 'Verified from curriculum',
      unverified: 'Cannot verify from available curriculum',
      sources: 'Sources',
      practice: 'Practice Question',
      feedback: 'Feedback',
      activity: 'Suggested Activity',
      tryQuestion: 'Try this question',
      startActivity: 'Start this activity',
      you: 'You',
      aiTutor: 'AI Tutor',
      attach: 'Attach document',
      voice: 'Voice input',
      feedbackOnAnswer: 'Feedback on your answer',
    },
    fr: {
      placeholder: 'Tapez votre question ici...',
      send: 'Envoyer',
      clearChat: 'Effacer la discussion',
      noDocument: 'Aucun document sélectionné',
      selectDocument: 'Sélectionnez un document pour commencer',
      typing: 'L\'IA réfléchit...',
      verified: 'Vérifié à partir du programme',
      unverified: 'Impossible de vérifier à partir du programme disponible',
      sources: 'Sources',
      practice: 'Question d\'entraînement',
      feedback: 'Commentaire',
      activity: 'Activité suggérée',
      tryQuestion: 'Essayer cette question',
      startActivity: 'Commencer cette activité',
      you: 'Vous',
      aiTutor: 'Tuteur IA',
      attach: 'Joindre un document',
      voice: 'Saisie vocale',
      feedbackOnAnswer: 'Commentaire sur votre réponse',
    },
  }

  const t = strings[language]

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4 border-b border-slate-200 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h2 className="font-semibold text-slate-800 truncate">{selectedDocument ? translateDocumentName(selectedDocument.name, language) : t.noDocument}</h2>
              {selectedDocument && (
                <p className="text-xs text-slate-500 truncate">
                  {translateSubject(selectedDocument.subject, language)} - {translateGrade(selectedDocument.grade, language)}
                </p>
              )}
            </div>
            {/* Compact label on mobile */}
            <div className="sm:hidden min-w-0">
              <h2 className="font-semibold text-slate-800 text-sm truncate max-w-[9rem]">
                {selectedDocument ? translateSubject(selectedDocument.subject, language) : t.noDocument}
              </h2>
            </div>
          </div>

          {/* Document selector in header */}
          {availableDocuments.length > 0 && (
            <div className="relative min-w-0">
              <select
                value={selectedDocument?.id || ''}
                onChange={(e) => {
                  const doc = availableDocuments.find(d => d.id === e.target.value)
                  if (doc) handleDocumentSelect(doc)
                }}
                className="max-w-full bg-white border border-slate-200 rounded-lg px-2 sm:px-3 py-1.5 text-sm text-slate-600 hover:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                {selectedDocument ? (
                  <option key={selectedDocument.id} value={selectedDocument.id}>
                    📄 {selectedDocument.name}
                  </option>
                ) : (
                  <option value="">{t.selectDocument}</option>
                )}
                {availableDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {translateDocumentName(doc.name, language)} ({doc.subject})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Language lives in the global TopBar */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title={t.clearChat}
            aria-label={t.clearChat}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center h-full text-center py-16"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative w-24 h-24 mb-5"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-200"
                >
                  <BookOpen className="w-12 h-12 text-white" />
                </motion.div>
                {/* Sparkles around the mascot */}
                <motion.span
                  animate={{ scale: [0.6, 1.2, 0.6], rotate: [0, 20, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-2 -right-1 text-lg"
                >✨</motion.span>
                <motion.span
                  animate={{ scale: [1, 0.6, 1], rotate: [0, -15, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: 0.5 }}
                  className="absolute -bottom-1 -left-1 text-base"
                >⭐</motion.span>
              </motion.div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {language === 'fr' ? 'Bonjour !' : 'Welcome!'} <span className="inline-block">👋</span>
              </h3>
              <p className="text-slate-500 max-w-md mx-auto mb-4">
                {language === 'fr'
                  ? 'Je suis votre assistant d\'apprentissage IA. Posez-moi des questions sur votre programme scolaire.'
                  : 'I am your AI Learning Assistant. Ask me questions about your curriculum.'}
              </p>

              <div className="flex flex-wrap justify-center gap-3 max-w-lg">
                {availableDocuments.slice(0, 3).map((doc, i) => (
                  <motion.button
                    key={doc.id}
                    whileHover={{ scale: 1.06, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onDocumentSelect(doc)}
                    className={`px-4 py-2 rounded-2xl text-sm font-medium transition-colors ${
                      i === 0 ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                      : i === 1 ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                    }`}
                  >
                    {['📚', '🔬', '🌍'][i] || '📘'} {translateSubject(doc.subject, language)}
                  </motion.button>
                ))}
              </div>

              {/* Fun starter prompts */}
              {selectedDocument && (
                <div className="mt-5">
                  <p className="text-xs text-slate-500 mb-2">
                    {language === 'fr' ? 'Essayez l\'un de ceux-ci :' : 'Try one of these:'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      language === 'fr' ? 'Parlez-moi des plantes 🌱' : 'Tell me about plants 🌱',
                      language === 'fr' ? 'Combien font 7 x 8 ? ✖️' : 'What is 7 x 8? ✖️',
                      language === 'fr' ? 'Donnez-moi une question d\'entraînement 🎯' : 'Give me a practice question 🎯',
                    ].map((prompt) => (
                      <motion.button
                        key={prompt}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setInputValue(prompt.replace(/[🌱✖️🎯]\s*$/, '').trim())
                          requestAnimationFrame(() => inputRef.current?.focus())
                        }}
                        className="px-3.5 py-1.5 bg-white border-2 border-dashed border-primary-200 text-primary-600 rounded-full text-xs font-medium hover:border-primary-400 transition-colors"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} max-w-4xl`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] ${message.role === 'user' ? 'order-1' : 'order-2'}`}
                >
                  {/* Message Bubble */}
                  <div
                    className={`relative px-6 py-4 rounded-2xl shadow-sm ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white rounded-br-lg'
                        : message.verified === false
                          // Unverified AI answers: dashed amber border so students
                          // can tell them from grounded curriculum answers
                          ? 'bg-white text-slate-700 rounded-bl-lg border-2 border-dashed border-amber-300'
                          : 'bg-white text-slate-700 rounded-bl-lg border border-slate-200'
                    }`}
                  >
                    {/* User message */}
                    {message.role === 'user' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <User className="w-4 h-4" />
                        <span className="text-xs opacity-80">{t.you}</span>
                        <span className="text-xs opacity-60 ml-auto">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Assistant message */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-3 h-3 text-primary-600" />
                        </div>
                        <span className="text-xs text-slate-500">{t.aiTutor}</span>
                        <span className="text-xs text-slate-500 ml-auto">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    )}

                    {/* Message Content */}
                    {(() => {
                      const isLong = message.content.length > 600
                      const expanded = expandedIds.has(message.id)
                      const toggleExpanded = () =>
                        setExpandedIds((prev) => {
                          const next = new Set(prev)
                          next.has(message.id) ? next.delete(message.id) : next.add(message.id)
                          return next
                        })
                      return (
                        <>
                          <div
                            className={`markdown-content break-words ${
                              message.role === 'user' ? 'text-white' : 'text-slate-700'
                            } ${isLong && !expanded ? 'max-h-64 overflow-y-auto pr-1' : ''}`}
                          >
                            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
                          </div>
                          {isLong && (
                            <button
                              onClick={toggleExpanded}
                              className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              {expanded ? 'Show less ↑' : 'Show full response ↓'}
                            </button>
                          )}
                        </>
                      )
                    })()}

                    {/* Message Metadata (for assistant messages) */}
                    {message.role === 'assistant' && message.metadata && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ delay: 0.3 }}
                        className="mt-4 pt-4 border-t border-slate-200 space-y-3"
                      >
                        {/* Verification Status — visually distinct provenance */}
                        {message.verified !== undefined && (
                          <div className="mb-2">
                            <AnswerProvenance verified={message.verified} language={language} model={message.metadata?.model} />
                          </div>
                        )}

                        {/* Practice Question */}
                        {message.metadata.practiceQuestion && (
                          <div className="bg-primary-50 p-3 rounded-xl border border-primary-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✏️</span>
                              </div>
                              <span className="font-medium text-primary-700 text-sm">{t.practice}</span>
                            </div>
                            <p className="text-sm text-slate-700">{message.metadata.practiceQuestion}</p>
                            <button
                              type="button"
                              onClick={() => {
                                // Register the attempt so the server grades the
                                // next message; focus the input. Do not send the
                                // question itself as a student message.
                                const q = message.metadata?.practiceQuestion
                                if (q) onAttemptPractice?.(q)
                                setInputValue(language === 'fr' ? 'Ma réponse est ' : 'My answer is ')
                                requestAnimationFrame(() => inputRef.current?.focus())
                              }}
                              disabled={isLoading}
                              className="mt-2 flex items-center space-x-1 px-3 py-1.5 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{t.tryQuestion}</span>
                            </button>
                          </div>
                        )}

                        {/* Feedback — only shown after the student's answer was graded */}
                        {message.metadata.feedback && (
                          <div className="bg-secondary-50 p-3 rounded-xl border border-secondary-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-4 h-4 bg-secondary-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">{message.metadata.correct === false ? '❌' : '✅'}</span>
                              </div>
                              <span className="font-medium text-secondary-700 text-sm">
                                {message.metadata.graded ? t.feedbackOnAnswer : t.feedback}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700">{message.metadata.feedback}</p>
                          </div>
                        )}

                        {/* Revision Activity */}
                        {message.metadata.revisionActivity && (
                          <div className="bg-accent-50 p-3 rounded-xl border border-accent-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className="w-4 h-4 bg-accent-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">🎯</span>
                              </div>
                              <span className="font-medium text-accent-700 text-sm">{t.activity}</span>
                            </div>
                            <p className="text-sm text-slate-700">{message.metadata.revisionActivity}</p>
                            <button
                              onClick={() => onSendMessage(message.metadata!.revisionActivity!)}
                              disabled={isLoading}
                              className="mt-2 flex items-center space-x-1 px-3 py-1.5 bg-accent-600 text-white text-xs font-medium rounded-lg hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{t.startActivity}</span>
                            </button>
                          </div>
                        )}

                        {/* Sources */}
                        {message.sources && message.sources.length > 0 && (
                          <div className="pt-2 border-t border-slate-200">
                            <p className="text-xs text-slate-500 mb-1">{t.sources}:</p>
                            <div className="flex flex-wrap gap-1">
                              {message.sources.map((source, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
                                >
                                  {source.docName}{source.page ? ` (p.${source.page})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Streaming indicator */}
                    {message.isStreaming && (
                      <div className="flex items-center justify-end mt-3">
                        <div className="flex space-x-1">
                          <motion.div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar */}
                <div className={`flex flex-col items-center ${message.role === 'user' ? 'order-2 ml-2' : 'order-1 mr-2'}`}>
                  {message.role === 'user' ? (
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <motion.div
                      animate={{ y: [0, -3, 0], rotate: [0, -4, 0, 4, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center border-2 border-white"
                    >
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Loading indicator */}
        {isLoading && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start max-w-4xl"
          >
            <div className="max-w-[80%]">
              <div className="bg-white px-6 py-4 rounded-2xl rounded-bl-lg border border-slate-200 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-3 h-3 text-primary-600" />
                  </div>
                  <span className="text-xs text-slate-500">{t.typing}</span>
                </div>
                <div className="flex space-x-1">
                  <motion.div
                    className="w-2 h-2 bg-slate-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-slate-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-slate-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </div>
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center border-2 border-white ml-2"
            >
              <BookOpen className="w-5 h-5 text-primary-600" />
            </motion.div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area — pinned to the bottom of the panel */}
      <div className="shrink-0 p-3 sm:p-4 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
            {/* Attachment button */}
            <button
              type="button"
              className="hidden sm:block p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all ml-2"
              title={t.attach}
              aria-label={t.attach}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Text area */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={t.placeholder}
              disabled={isLoading}
              rows={1}
              className="flex-1 p-3 bg-transparent border-none focus:ring-0 resize-none text-slate-700 placeholder:text-slate-400 outline-none max-h-40"
            />

            {/* Voice input button */}
            <button
              type="button"
              className="hidden sm:block p-3 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
              title={t.voice}
              aria-label={t.voice}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label={t.send}
              className={`p-3 mr-2 rounded-xl transition-all ${
                inputValue.trim() && !isLoading
                  ? 'bg-primary-600 text-white hover:bg-primary-700'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              title={t.send}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* Quick actions */}
          {selectedDocument && (
            <div className="flex justify-center mt-3 space-x-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setInputValue('Explain this concept: ')}
                className="px-3.5 py-1.5 text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-full border border-violet-200 transition-colors"
              >
                💡 Explain
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setInputValue('Give me a practice question: ')}
                className="px-3.5 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-full border border-amber-200 transition-colors"
              >
                ✏️ Practice
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setInputValue('Summarize the key points: ')}
                className="px-3.5 py-1.5 text-xs font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 rounded-full border border-sky-200 transition-colors"
              >
                📝 Summarize
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatPanel
