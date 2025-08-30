import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '../styles/print.css'
import Sidebar from '@/components/layout/Sidebar'
import Providers from '@/providers/Providers'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import ChunkErrorHandler from '@/components/error/ChunkErrorHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM Sodiluxe',
  description: 'Gestion de la relation client pour Sodiluxe - ic_future by ecqm19',
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
    shortcut: '/logo.svg'
  },
  creator: 'ic_future by ecqm19',
  authors: [{ name: 'ic_future by ecqm19' }]
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-20 bg-gray-50">
              {children}
            </main>
          </div>
          <Toaster />
          <SonnerToaster position="top-right" richColors />
          <ChunkErrorHandler />
        </Providers>
      </body>
    </html>
  )
}
