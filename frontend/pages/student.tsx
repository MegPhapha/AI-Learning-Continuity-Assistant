'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import ChatPanel from '../components/ChatPanel'
import DailyChallenge, { DailyStats, levelFor } from '../components/DailyChallenge'
import Celebration from '../components/Celebration'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'
import { translateSubject, translateGrade } from '../lib/i18n'
import { Document } from '../types'
import { ChatAPI, DocumentsAPI, healthCheck } from '../lib/api'
import { AlertCircle, Zap, ChevronDown } from 'react-feather'
import { motion } from 'framer-motion'

// Demo documents data (fallback when backend is not available)
const DEMO_DOCUMENTS: Document[] = [
  {
    id: 'demo-math',
    name: 'Mathematics Curriculum',
    subject: 'Mathematics',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(),
    size: 5000,
    pageCount: 10,
  },
  {
    id: 'demo-science',
    name: 'Science Curriculum',
    subject: 'Science',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(),
    size: 8000,
    pageCount: 15,
  },
  {
    id: 'demo-french',
    name: 'French Curriculum',
    subject: 'French',
    grade: 'Grade 3',
    language: 'fr',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(),
    size: 10000,
    pageCount: 12,
  },
  {
    id: 'demo-health',
    name: 'Health Education',
    subject: 'Health Education',
    grade: 'Grade 3',
    language: 'en',
    fileType: 'txt',
    status: 'approved',
    uploadedAt: new Date(),
    size: 7000,
    pageCount: 8,
  },
]

// Demo responses (fallback when backend is not available)
const getDemoResponse = (message: string, document: Document, language: string) => {
  const responses: Record<string, Record<string, Record<string, string>>> = {
    en: {
      math: {
        'add': `**Adding Numbers**\n\nTo add 245 + 123:\n\n1. **Align the numbers by place value:**\n   \`\`\`\n    245\n  +123\n   ---\n   \`\`\`\n\n2. **Add the units place:** 5 + 3 = 8\n3. **Add the tens place:** 4 + 2 = 60\n4. **Add the hundreds place:** 200 + 100 = 300\n5. **Combine:** 300 + 60 + 8 = **368**\n\n*Remember: Start from the rightmost digit and move left!*`,
        'multiply': `**Multiplication Basics**\n\nMultiplication is repeated addition. For example:\n\n- 5 × 3 means 5 + 5 + 5 = 15\n- 4 × 6 means 4 + 4 + 4 + 4 + 4 + 4 = 24\n\n**Practice:** Try 7 × 4 on your own!`,
        'default': `I'm your AI Learning Assistant! I can help you understand **${document.subject}** concepts.\n\nFor Grade ${document.grade}, we cover topics like:\n- Addition and subtraction\n- Multiplication and division\n- Fractions\n- Geometry\n\n**Ask me anything about your curriculum!**`,
      },
      science: {
        'water': `**The Water Cycle**\n\nThe water cycle describes how water moves through the environment:\n\n1. **Evaporation** - Sun heats water, turning it into vapor\n2. **Condensation** - Water vapor cools and forms clouds\n3. **Precipitation** - Water falls as rain, snow, or hail\n4. **Collection** - Water gathers in rivers, lakes, and oceans\n\nThis cycle repeats continuously, keeping Earth's water supply fresh!`,
        'default': `Welcome to **Science** for Grade ${document.grade}!\n\nI can explain concepts like:\n- The water cycle\n- Plant life cycles\n- Simple machines\n- Weather and climate\n\n**What would you like to learn today?**`,
      },
      health: {
        'wash': `**Why Hand Washing is Important**\n\nWashing your hands properly:\n\n✅ **Removes germs** that can make you sick\n✅ **Prevents diseases** like colds and flu\n✅ **Protects others** from getting sick\n✅ **Keeps you healthy** for learning\n\n**Proper technique:**\n1. Wet hands with clean water\n2. Apply soap\n3. Scrub for 20 seconds\n4. Rinse well\n5. Dry with clean towel`,
        'default': `**Health Education** is important for your well-being!\n\nIn Grade ${document.grade}, we learn about:\n- Personal hygiene\n- Healthy eating\n- Exercise and movement\n- Preventing illness\n\n**Ask me about staying healthy!**`,
      },
    },
    fr: {
      math: {
        'add': `**Addition de nombres**\n\nPour additionner 245 + 123:\n\n1. **Alignez les nombres par valeur de position:**\n   \`\`\`\n    245\n  +123\n   ---\n   \`\`\`\n\n2. **Additionnez les unités:** 5 + 3 = 8\n3. **Additionnez les dizaines:** 4 + 2 = 60\n4. **Additionnez les centaines:** 200 + 100 = 300\n5. **Combinez:** 300 + 60 + 8 = **368**\n\n*Souvenir: Commencez par le chiffre le plus à droite!*`,
        'default': `Je suis votre assistant d'apprentissage IA! Je peux vous aider à comprendre les concepts de **${document.subject}**.\n\nPour la classe de ${document.grade}, nous couvrons des sujets comme:\n- Addition et soustraction\n- Multiplication et division\n- Fractions\n- Géométrie\n\n**Posez-moi n'importe quelle question sur votre programme!**`,
      },
      science: {
        'default': `Bienvenue dans **Sciences** pour la classe ${document.grade}!\n\nJe peux expliquer des concepts comme:\n- Le cycle de l'eau\n- Le cycle de vie des plantes\n- Les machines simples\n- La météo et le climat\n\n**Que souhaitez-vous apprendre aujourd'hui?**`,
      },
      health: {
        'wash': `**Pourquoi le lavage des mains est important**\n\nSe laver les mains correctement:\n\n✅ **Éliminer les germes** qui peuvent vous rendre malade\n✅ **Prévenir les maladies** comme le rhume et la grippe\n✅ **Protéger les autres** de tomber malade\n✅ **Rester en bonne santé** pour apprendre\n\n**Technique appropriée:**\n1. Mouillez les mains avec de l'eau propre\n2. Appliquez du savon\n3. Frottez pendant 20 secondes\n4. Rincez bien\n5. Séchez avec une serviette propre`,
        'default': `**L'éducation à la santé** est importante pour votre bien-être!\n\nEn classe ${document.grade}, nous apprenons:\n- Hygiène personnelle\n- Alimentation saine\n- Exercice et mouvement\n- Prévention des maladies\n\n**Demandez-moi comment rester en bonne santé!**`,
      },
    },
  }

  const subjectKey = document.subject?.toLowerCase() || 'default'
  const langData = responses[language as keyof typeof responses]
  const subjectData = langData[subjectKey as keyof typeof langData] || langData['default']

  // Simple keyword matching for demo responses
  const messageLower = message.toLowerCase()

  // If the student sends an exercise to solve (e.g. "456 + 289 = ?"), guide
  // them to attempt it instead of giving the full answer right away
  if (/\d+\s*[+×*]\s*\d+\s*=\s*\?/i.test(message) || /what\s+is\s+\d+\s*[+×*]\s*\d+/i.test(messageLower)) {
    return language === 'fr'
      ? `**À vous de jouer !** 🎯\n\nEssayons **ensemble**, étape par étape :\n\n1. **Alignez les nombres par valeur de position**\n2. **Commencez par la colonne des unités**\n\nDonnez-moi votre réponse et je vérifierai si elle est correcte ! 💪`
      : `**Your turn to try!** 🎯\n\nLet's solve this **together**, step by step:\n\n1. **Align the numbers by place value**\n2. **Start with the units column**\n\nTell me your answer and I'll check it for you! 💪`
  }

  if (messageLower.includes('add') || messageLower.includes('+')) {
    return subjectData['add'] || subjectData['default']
  }
  if (messageLower.includes('multiply') || messageLower.includes('×') || messageLower.includes('*')) {
    return subjectData['multiply'] || subjectData['default']
  }
  if (messageLower.includes('water') || messageLower.includes('cycle')) {
    return subjectData['water'] || subjectData['default']
  }
  if (messageLower.includes('wash') || messageLower.includes('hand') || messageLower.includes('hygiene')) {
    return subjectData['wash'] || subjectData['default']
  }
  
  return subjectData['default'] || 'I can help you with your curriculum questions!'
}

export default function StudentPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    isStreaming?: boolean
    verified?: boolean
    sources?: Array<{ docName: string; page?: number }>
    metadata?: any
  }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(DEMO_DOCUMENTS[0])
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>(DEMO_DOCUMENTS)
  const { language, setLanguage } = useLanguage()
  const [backendAvailable, setBackendAvailable] = useState(false)
  // Server session so the tutor can grade practice attempts in context
  const [sessionId, setSessionId] = useState<string | null>(null)
  // Practice question the student is currently attempting (if any)
  const [pendingPractice, setPendingPractice] = useState<string | null>(null)

  // Daily targets & challenges — persisted per day.
  // Start with empty stats so SSR and the first client render match (no hydration
  // mismatch), then load stored stats after mount.
  const today = new Date().toISOString().split('T')[0]
  const emptyDailyStats = (): DailyStats => ({
    date: today,
    questionsAsked: 0,
    practiceCompleted: 0,
    subjectsExplored: [],
    xp: 0,
  })
  const [dailyStats, setDailyStats] = useState<DailyStats>(emptyDailyStats)
  // Confetti when the student gets a practice answer right
  const [celebrate, setCelebrate] = useState(false)
  // Metrics panel visibility (level button at the top)
  const [showStats, setShowStats] = useState(false)
  const levelInfo = levelFor(dailyStats.xp ?? 0)

  useEffect(() => {
    // Client-only: restore today's progress after hydration
    try {
      const raw = window.localStorage.getItem('daily-stats')
      if (raw) {
        const parsed = JSON.parse(raw) as DailyStats
        if (parsed.date === today) setDailyStats(parsed)
      }
    } catch {
      // corrupted storage — start fresh
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateDailyStats = (updater: (s: DailyStats) => DailyStats) => {
    setDailyStats((prev) => {
      const s = prev.date === today ? prev : emptyDailyStats()
      const next = updater(s)
      try {
        window.localStorage.setItem('daily-stats', JSON.stringify(next))
      } catch {
        // storage unavailable — keep in-memory progress
      }
      return next
    })
  }

  // Check backend availability
  useEffect(() => {
    healthCheck().then(setBackendAvailable)
    // Load real documents if backend is available
    DocumentsAPI.getDemoDocuments()
      .then(setAvailableDocuments)
      .catch(() => setAvailableDocuments(DEMO_DOCUMENTS))
  }, [])

  // Initialize chat with selected document
  // Initialize chat with the selected document only — switching language
  // must NOT wipe the conversation
  useEffect(() => {
    if (selectedDocument) {
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          content: language === 'fr'
            ? `Bonjour ! Je suis votre assistant d'apprentissage IA pour **${selectedDocument.subject} - ${selectedDocument.grade}**. Posez-moi des questions sur votre programme.`
            : `Hello! I'm your AI Learning Assistant for **${selectedDocument.subject} - ${selectedDocument.grade}**. Ask me questions about your curriculum.`,
          timestamp: new Date(),
          verified: true,
          sources: [{ docName: selectedDocument.name, page: 1 }],
        },
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDocument])

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedDocument) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      let response: any

      if (backendAvailable) {
        // Use real backend — pass the session and any pending practice question
        response = await ChatAPI.sendMessage(
          selectedDocument.id,
          content,
          language,
          {
            sessionId: sessionId ?? undefined,
            attempting: pendingPractice ?? undefined,
          }
        )
        if (response.sessionId) setSessionId(response.sessionId)
      } else {
        // Use demo response
        const demoResponse = getDemoResponse(content, selectedDocument, language)
        response = {
          content: demoResponse,
          sources: [{ docName: selectedDocument.name, page: 1 }],
          verified: true,
          metadata: {
            subject: selectedDocument.subject,
            practiceQuestion: language === 'fr'
              ? 'Quelle est la capitale de la France?'
              : 'What is the capital of France?',
            feedback: language === 'fr'
              ? 'Essayez de résoudre le problème par vous-même d\'abord!'
              : 'Try to solve the problem yourself first!',
            revisionActivity: language === 'fr'
              ? 'Faites une carte mentale des concepts clés.'
              : 'Create a mind map of the key concepts.',
          },
        }
      }

      // Track whether the tutor is now waiting for an attempt
      setPendingPractice(
        response.metadata?.awaitingAttempt && response.metadata?.practiceQuestion
          ? response.metadata.practiceQuestion
          : null
      )

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: response.content,
        timestamp: new Date(),
        verified: response.verified,
        sources: response.sources,
        metadata: response.metadata,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Counters reward real work: a question counts once the tutor answered,
      // and practice counts once an attempt was graded (not on button clicks)
      if (response.content) {
        updateDailyStats((s) => ({
          ...s,
          questionsAsked: s.questionsAsked + 1,
          xp: (s.xp ?? 0) + 10,
          subjectsExplored: !s.subjectsExplored.includes(selectedDocument.subject)
            ? [...s.subjectsExplored, selectedDocument.subject]
            : s.subjectsExplored,
        }))
      }
      if (response.metadata?.graded) {
        const gotItRight = response.metadata.correct === true
        updateDailyStats((s) => ({
          ...s,
          practiceCompleted: s.practiceCompleted + 1,
          xp: (s.xp ?? 0) + (gotItRight ? 25 : 5),
        }))
        if (gotItRight) setCelebrate(true)
      }
    } catch (error) {
      const errorMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant' as const,
        content: language === 'fr'
          ? 'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.'
          : 'Sorry, I couldn\'t process your request. Please try again.',
        timestamp: new Date(),
        verified: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc)
    setMessages([])
  }

  return (
    <>
      {/* Confetti burst when the student gets a practice answer right */}
      <Celebration show={celebrate} onHide={() => setCelebrate(false)} />

      <Layout
      title={`${selectedDocument?.subject || 'Student'} - AI Learning Assistant`}
      description="AI-powered learning chat for students"
    >
      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Level button — always visible, opens the metrics panel */}
        <div className="shrink-0 mx-2 sm:mx-0 mt-2">
          <button
            type="button"
            onClick={() => setShowStats((v) => !v)}
            aria-expanded={showStats}
            className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-slate-200 px-4 py-2.5 hover:border-amber-300 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm">
              <motion.span
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0"
              >
                <Zap className="w-4 h-4 text-white" />
              </motion.span>
              <span className="font-bold text-slate-700">
                {language === 'fr' ? 'Niveau' : 'Level'} {levelInfo.level} · <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">{levelInfo.name}</span>
              </span>
              <span className="font-bold text-amber-600 text-xs">{dailyStats.xp ?? 0} XP ⭐</span>
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
              {language === 'fr' ? 'Voir mes progrès' : 'View my progress'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showStats ? 'rotate-180' : ''}`} />
            </span>
          </button>
        </div>

        {/* Daily Targets & Challenges — shown when the level button is open */}
        {showStats && (
          <div className="shrink-0">
            <DailyChallenge stats={dailyStats} language={language} />
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col px-2 sm:px-0 pb-2 sm:pb-0">
          <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedDocument={selectedDocument ? {
            id: selectedDocument.id,
            name: selectedDocument.name,
            subject: selectedDocument.subject,
            grade: selectedDocument.grade,
          } : undefined}
          onDocumentSelect={(doc) => {
            const fullDoc = availableDocuments.find(d => d.id === doc.id)
            if (fullDoc) handleDocumentSelect(fullDoc)
          }}
          availableDocuments={availableDocuments.map(d => ({
            id: d.id,
            name: d.name,
            subject: d.subject,
            grade: d.grade,
          }))}
          language={language}
          onLanguageChange={(lang) => {
            // Switch the whole UI language; keep an existing conversation, but
            // re-greet in the new language if the chat hasn't really started
            setLanguage(lang)
            if (messages.length <= 1 && messages[0]?.id.startsWith('welcome-') && selectedDocument) {
              setMessages([
                {
                  id: 'welcome-' + Date.now(),
                  role: 'assistant' as const,
                  content: lang === 'fr'
                    ? `Bonjour ! Je suis votre assistant d'apprentissage IA pour **${selectedDocument.subject} - ${selectedDocument.grade}**. Posez-moi des questions sur votre programme.`
                    : `Hello! I'm your AI Learning Assistant for **${selectedDocument.subject} - ${selectedDocument.grade}**. Ask me questions about your curriculum.`,
                  timestamp: new Date(),
                  verified: true,
                  sources: [{ docName: selectedDocument.name, page: 1 }],
                },
              ])
            }
          }}
        />
        </div>
      </div>

      {/* Demo Mode Notice */}
      {!backendAvailable && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{language === 'fr' ? 'Mode démo - Backend non connecté' : 'Demo mode - Backend not connected'}</span>
          </div>
        </div>
      )}
    </Layout>
    </>
  )
}
