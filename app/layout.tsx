import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Relanco — Suivi acheteur intelligent',
  description: 'Gérez vos acheteurs et générez des messages de suivi avec l\'IA',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@300;400;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Lato', system-ui, sans-serif", background: '#F7F5F0', margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
