'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
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
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Une erreur est survenue</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Nous sommes désolés, une erreur inattendue s&apos;est produite.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button 
          onClick={reset} 
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Réessayer
        </button>
        <Link 
          href="/" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}