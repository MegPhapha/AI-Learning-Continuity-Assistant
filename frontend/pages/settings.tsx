'use client'

import { useState } from 'react'
import Layout from '../components/Layout'
import { useLanguage } from '../components/LanguageContext'
import { Settings, Globe, Moon, Sun, User, Bell, Shield, Sliders } from 'react-feather'

const settingsSections = [
  {
    id: 'profile',
    title: 'Profile',
    icon: User,
    description: 'Manage your account settings',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: Sliders,
    description: 'Customize the look and feel',
  },
  {
    id: 'language',
    title: 'Language',
    icon: Globe,
    description: 'Set your preferred language',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    description: 'Configure notification preferences',
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    icon: Shield,
    description: 'Manage your data and security',
  },
]

export default function SettingsPage() {
  const { language, setLanguage } = useLanguage()
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [resetDone, setResetDone] = useState(false)

  const fr = language === 'fr'

  // Clears the browser's saved demo progress (XP, level, streaks) and the
  // saved role, so the next visit starts from the role-choice landing page.
  const resetDemoData = () => {
    try {
      window.localStorage.removeItem('daily-stats')
      window.localStorage.removeItem('app-role')
      setResetDone(true)
    } catch {
      // storage unavailable — nothing to reset
    }
  }

  const settingsSections = [
    {
      id: 'appearance',
      title: fr ? 'Apparence' : 'Appearance',
      icon: Sliders,
      description: fr ? 'Personnalisez l\'apparence' : 'Customize the look and feel',
    },
    {
      id: 'language',
      title: fr ? 'Langue' : 'Language',
      icon: Globe,
      description: fr ? 'Définissez votre langue préférée' : 'Set your preferred language',
    },
    {
      id: 'notifications',
      title: fr ? 'Notifications' : 'Notifications',
      icon: Bell,
      description: fr ? 'Configurez les notifications' : 'Configure notification preferences',
    },
    {
      id: 'privacy',
      title: fr ? 'Confidentialité et sécurité' : 'Privacy & Security',
      icon: Shield,
      description: fr ? 'Gérez vos données et votre sécurité' : 'Manage your data and security',
    },
  ]

  const toggleTheme = () => {
    const newTheme: 'light' | 'dark' | 'system' = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
    setTheme(newTheme)
    // In a real app, you would save this to localStorage
  }

  return (
    <Layout
      title="Settings - AI Learning Assistant"
      description="Configure your app settings"
    >
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">
                  {language === 'fr' ? 'Paramètres' : 'Settings'}
                </h1>
                <p className="text-slate-500 mt-1">
                  {language === 'fr' ? 'Personnalisez votre expérience' : 'Customize your experience'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <div className="max-w-4xl mx-auto">
            {/* Language Toggle */}
            <div className="mb-8">
              <div className="flex bg-white rounded-2xl p-2 border border-slate-200 shadow-sm max-w-fit">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    language === 'en'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>English</span>
                </button>
                <button
                  onClick={() => setLanguage('fr')}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all flex items-center space-x-2 ${
                    language === 'fr'
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  <span>Français</span>
                </button>
              </div>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              {settingsSections.map((section) => (
                <div
                  key={section.id}
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

                  {/* Section Content */}
                  <div className="pl-14 space-y-4">
                    {section.id === 'language' && (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-700">
                            {language === 'fr' ? 'Langue' : 'Language'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {language === 'fr' ? 'Sélectionnez votre langue préférée' : 'Select your preferred language'}
                          </p>
                        </div>
                        <div className="flex bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => setLanguage('en')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              language === 'en'
                                ? 'bg-white text-slate-800 shadow'
                                : 'text-slate-500'
                            }`}
                          >
                            English
                          </button>
                          <button
                            onClick={() => setLanguage('fr')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              language === 'fr'
                                ? 'bg-white text-slate-800 shadow'
                                : 'text-slate-500'
                            }`}
                          >
                            Français
                          </button>
                        </div>
                      </div>
                    )}

                    {section.id === 'appearance' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-700">
                              {language === 'fr' ? 'Thème' : 'Theme'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {language === 'fr' ? 'Choisissez votre thème' : 'Choose your theme'}
                            </p>
                          </div>
                          <div className="flex bg-slate-100 rounded-lg p-1">
                            <button
                              onClick={() => setTheme('light')}
                              className={`p-3 rounded-lg transition-all ${
                                theme === 'light'
                                  ? 'bg-white text-slate-800 shadow'
                                  : 'text-slate-500'
                              }`}
                            >
                              <Sun className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setTheme('dark')}
                              className={`p-3 rounded-lg transition-all ${
                                theme === 'dark'
                                  ? 'bg-white text-slate-800 shadow'
                                  : 'text-slate-500'
                              }`}
                            >
                              <Moon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setTheme('system')}
                              className={`p-3 rounded-lg transition-all ${
                                theme === 'system'
                                  ? 'bg-white text-slate-800 shadow'
                                  : 'text-slate-500'
                              }`}
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-700">
                              {language === 'fr' ? 'Animations' : 'Animations'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {language === 'fr' ? 'Activer les animations fluides' : 'Enable smooth animations'}
                            </p>
                          </div>
                          <button className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <span className="absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform"></span>
                          </button>
                        </div>
                      </>
                    )}

                    {section.id === 'notifications' && (
                      <>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-700">
                              {language === 'fr' ? 'Notifications' : 'Notifications'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {language === 'fr' ? 'Recevoir des notifications' : 'Receive notifications'}
                            </p>
                          </div>
                          <button
                            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              notificationsEnabled ? 'bg-primary-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            ></span>
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-700">
                              {language === 'fr' ? 'Son des notifications' : 'Notification Sound'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {language === 'fr' ? 'Jouer un son pour les notifications' : 'Play sound for notifications'}
                            </p>
                          </div>
                          <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                              soundEnabled ? 'bg-primary-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                soundEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            ></span>
                          </button>
                        </div>
                      </>
                    )}

                    {section.id === 'privacy' && (
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="font-medium text-slate-700">
                            {language === 'fr' ? 'Réinitialiser les données de démonstration' : 'Reset demo data'}
                          </p>
                          <p className="text-sm text-slate-500">
                            {language === 'fr'
                              ? 'Efface la progression enregistrée (XP, niveau, série) et le rôle choisi. La prochaine visite commencera sur la page de choix du rôle.'
                              : 'Clears your saved progress (XP, level, streak) and chosen role. Your next visit starts on the role-choice page.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={resetDemoData}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            resetDone
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-800 text-white hover:bg-slate-900'
                          }`}
                        >
                          {resetDone
                            ? (language === 'fr' ? '✓ Réinitialisé' : '✓ Reset')
                            : (language === 'fr' ? 'Réinitialiser' : 'Reset')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
