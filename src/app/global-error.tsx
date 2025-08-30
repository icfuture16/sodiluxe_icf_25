'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionnel : journalisation de l'erreur côté client
    console.error(error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <h1 className="text-4xl font-bold text-red-600 mb-4">Erreur critique</h1>
          <p className="text-gray-600 mb-8 max-w-md">
            Une erreur critique s&apos;est produite. Veuillez réessayer ou contacter le support.
          </p>
          <button 
            onClick={reset} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  )
}