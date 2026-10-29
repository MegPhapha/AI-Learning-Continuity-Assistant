import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { AnimatePresence } from 'framer-motion'
import { LanguageProvider } from '../components/LanguageContext'
import { RoleProvider } from '../components/RoleContext'

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <LanguageProvider>
      <RoleProvider>
        <AnimatePresence mode="wait">
          <Component {...pageProps} key={router.route} />
        </AnimatePresence>
      </RoleProvider>
    </LanguageProvider>
  )
}
