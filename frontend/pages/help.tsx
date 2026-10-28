'use client'

import Layout from '../components/Layout'
import { HelpCircle, BookOpen, MessageSquare, Settings, User, Shield } from 'react-feather'
import { motion } from 'framer-motion'
import { useLanguage } from '../components/LanguageContext'

const getHelpSections = (fr: boolean) => [
  {
    icon: BookOpen,
    title: fr ? 'Premiers pas' : 'Getting Started',
    description: fr ? 'Apprenez à utiliser l\'assistant d\'apprentissage IA' : 'Learn how to use the AI Learning Assistant',
    steps: fr
      ? [
          'Sélectionnez un document de programme dans la liste',
          'Posez des questions dans le panneau de discussion',
          'Recevez des explications personnalisées et des questions d\'entraînement',
          'Obtenez des commentaires sur vos réponses',
        ]
      : [
          'Select a curriculum document from the sidebar',
          'Ask questions in the chat panel',
          'Receive personalized explanations and practice questions',
          'Get feedback on your answers',
        ],
  },
  {
    icon: MessageSquare,
    title: fr ? 'Fonctions de discussion' : 'Chat Features',
    description: fr ? 'Découvrez les capacités du tuteur IA' : 'Understand the chat capabilities',
    steps: fr
      ? [
          'Posez des questions sur votre programme',
          'Obtenez des explications avec des exemples',
          'Recevez des questions d\'entraînement',
          'Consultez les sources tirées de vos documents',
        ]
      : [
          'Ask questions about your curriculum',
          'Get explanations with examples',
          'Receive practice questions',
          'See source references from your documents',
        ],
  },
  {
    icon: Settings,
    title: fr ? 'Paramètres' : 'Settings',
    description: fr ? 'Personnalisez votre expérience' : 'Customize your experience',
    steps: fr
      ? [
          'Choisissez entre l\'anglais et le français',
          'Changez de thème (clair / sombre / système)',
          'Activez ou désactivez les notifications',
          'Gérez votre profil',
        ]
      : [
          'Switch between English and French',
          'Change theme (light/dark/system)',
          'Enable or disable notifications',
          'Manage your profile',
        ],
  },
  {
    icon: User,
    title: fr ? 'Tableau de bord enseignant' : 'Teacher Dashboard',
    description: fr ? 'Gérez les documents de programme' : 'Manage curriculum documents',
    steps: fr
      ? [
          'Téléversez des fichiers PDF, DOCX ou TXT',
          'Vérifiez et approuvez les documents',
          'Suivez les réponses signalées',
          'Consultez les statistiques',
        ]
      : [
          'Upload PDF, DOCX, or TXT files',
          'Review and approve documents',
          'Monitor flagged responses',
          'View statistics and analytics',
        ],
  },
  {
    icon: Shield,
    title: fr ? 'Mesures de sécurité' : 'Safeguards',
    description: fr ? 'Découvrez nos fonctions de sécurité' : 'Understand our safety features',
    steps: fr
      ? [
          'Toutes les réponses sont vérifiées à partir des documents de programme',
          'Les réponses incertaines sont clairement signalées',
          'Les sources sont toujours citées',
          'L\'approbation d\'un enseignant est requise pour les documents',
          'Le contenu inapproprié est signalé',
        ]
      : [
          'All answers are verified from curriculum documents',
          'Uncertain answers are clearly marked',
          'Sources are always cited',
          'Teacher approval is required for documents',
          'Inappropriate content is flagged',
        ],
  },
]

const getFaqs = (fr: boolean) => [
  {
    question: fr ? 'Comment téléverser un document ?' : 'How do I upload a document?',
    answer: fr
      ? 'Allez dans le tableau de bord enseignant, cliquez sur « Ajouter un document », choisissez un fichier, indiquez la matière et la classe, puis cliquez sur Téléverser.'
      : 'Go to the Teacher Dashboard, click "Add Document", select a file, enter the subject and grade, and click Upload.',
  },
  {
    question: fr ? 'Quels formats de fichiers sont pris en charge ?' : 'What file formats are supported?',
    answer: fr
      ? 'Nous prenons en charge les fichiers PDF, DOCX et TXT. Vous pouvez téléverser des documents de programme dans n\'importe lequel de ces formats.'
      : 'We support PDF, DOCX, and TXT files. You can upload curriculum documents in any of these formats.',
  },
  {
    question: fr ? 'Les réponses de l\'IA sont-elles fiables ?' : 'How accurate are the AI responses?',
    answer: fr
      ? 'Toutes les réponses de l\'IA sont basées sur les documents de programme que vous téléversez. Le système fournit uniquement des informations vérifiables à partir de vos documents approuvés.'
      : 'All AI responses are based on the curriculum documents you upload. The system only provides information that can be verified from your approved documents.',
  },
  {
    question: fr ? 'Puis-je l\'utiliser hors ligne ?' : 'Can I use this offline?',
    answer: fr
      ? 'Pour l\'inférence locale, installez Ollama et téléchargez un modèle. Consultez le guide d\'installation pour plus de détails.'
      : 'For local inference, you need to install Ollama and pull a model. See the setup guide for more details.',
  },
  {
    question: fr ? 'Comment changer de langue ?' : 'How do I switch languages?',
    answer: fr
      ? 'Utilisez le bouton de langue en haut à droite de n\'importe quelle page. Vous pouvez passer de l\'anglais au français à tout moment.'
      : 'Use the language toggle in the top-right corner of any page. You can switch between English and French at any time.',
  },
  {
    question: fr ? 'Quelle est la configuration requise ?' : 'What are the system requirements?',
    answer: fr
      ? 'Pour l\'interface web, tout navigateur moderne fonctionne. Pour les modèles d\'IA locaux, il faut un ordinateur avec au moins 8 Go de RAM.'
      : 'For the web interface, any modern browser works. For local AI models, you need a computer with at least 8GB RAM and a decent GPU.',
  },
]

export default function HelpPage() {
  const { language } = useLanguage()
  const fr = language === 'fr'
  const t = (en: string, frText: string) => (fr ? frText : en)

  const helpSections = getHelpSections(fr)
  const faqs = getFaqs(fr)

  const quickSteps = [
    { n: '1', title: t('Select a Document', 'Choisissez un document'), desc: t('Choose a curriculum document from the sidebar to start learning', 'Choisissez un document de programme dans la liste pour commencer') },
    { n: '2', title: t('Ask a Question', 'Posez une question'), desc: t('Type your question in the chat panel and press Enter or click Send', 'Tapez votre question dans le chat puis appuyez sur Entrée ou Envoyer') },
    { n: '3', title: t('Learn & Practice', 'Apprenez et entraînez-vous'), desc: t('Get explanations, practice questions, and feedback to help you learn', 'Recevez des explications, des exercices et des commentaires pour apprendre') },
  ]

  return (
    <Layout
      title={t('Help - AI Learning Assistant', 'Aide - Assistant d\'apprentissage IA')}
      description={t('Get help and support for the AI Learning Assistant', 'Obtenez de l\'aide pour l\'assistant d\'apprentissage IA')}
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{t('Help & Support', 'Aide et assistance')}</h1>
                <p className="text-slate-500 mt-1">
                  {t('Everything you need to know about the AI Learning Assistant', 'Tout ce qu\'il faut savoir sur l\'assistant d\'apprentissage IA')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-6xl mx-auto">
            {/* Quick Start Guide */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-8"
            >
              <h2 className="text-lg font-bold text-slate-800 mb-4">{t('Quick Start', 'Démarrage rapide')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickSteps.map((step, i) => (
                  <motion.div
                    key={step.n}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center p-6 bg-slate-50 rounded-xl"
                  >
                    <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">{step.n}</span>
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Help Sections */}
            <div className="space-y-6 mb-8">
              {helpSections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-3 bg-primary-100 rounded-xl">
                      <section.icon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{section.title}</h3>
                      <p className="text-sm text-slate-500">{section.description}</p>
                    </div>
                  </div>

                  <ol className="space-y-3 pl-10">
                    {section.steps.map((step, stepIndex) => (
                      <motion.li
                        key={stepIndex}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 + stepIndex * 0.05 }}
                        className="flex items-start space-x-3"
                      >
                        <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-sm font-medium text-primary-600 flex-shrink-0">
                          {stepIndex + 1}
                        </span>
                        <span className="text-slate-600">{step}</span>
                      </motion.li>
                    ))}
                  </ol>
                </motion.div>
              ))}
            </div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-primary-100 rounded-xl">
                  <MessageSquare className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{t('Frequently Asked Questions', 'Questions fréquentes')}</h2>
                  <p className="text-slate-500">{t('Find answers to common questions', 'Réponses aux questions courantes')}</p>
                </div>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + index * 0.05 }}
                    className="border border-slate-200 rounded-xl p-4"
                  >
                    <h3 className="font-semibold text-slate-800 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Support Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 text-white mt-8"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{t('Need More Help?', 'Besoin d\'aide ?')}</h3>
                  <p className="opacity-90">
                    {t(
                      'If you have any questions or need assistance, please reach out to our support team.',
                      'Si vous avez des questions ou besoin d\'aide, contactez notre équipe d\'assistance.'
                    )}
                  </p>
                </div>
                <button className="px-6 py-3 bg-white text-primary-600 rounded-xl hover:bg-slate-100 transition-all font-medium">
                  {t('Contact Support', 'Contacter l\'assistance')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
