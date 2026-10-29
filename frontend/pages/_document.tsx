import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Offline-first: no webfont requests. The system font stack
            (configured in tailwind.config.js / globals.css) renders instantly
            even with no connectivity. */}
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
