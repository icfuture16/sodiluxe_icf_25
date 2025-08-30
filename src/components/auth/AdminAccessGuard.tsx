'use client'

import { useState, useEffect } from 'react'
import { accessCodeService } from '@/lib/appwrite/access-code'
import { useRouter } from 'next/navigation'

interface AdminAccessGuardProps {
  children: React.ReactNode
}

export default function AdminAccessGuard({ children }: AdminAccessGuardProps) {
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()
  
  // Vérifier si le code est déjà stocké dans le localStorage
  useEffect(() => {
    const storedAdminAccess = localStorage.getItem('adminAccessGranted')
    if (storedAdminAccess === 'true') {
      setIsAuthorized(true)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const isValid = await accessCodeService.verifyAccessCode(accessCode)
      
      if (isValid) {
        // Stocker l'accès dans le localStorage pour éviter de redemander le code à chaque fois
        localStorage.setItem('adminAccessGranted', 'true')
        setIsAuthorized(true)
      } else {
        setError('Code d\'accès invalide')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Erreur lors de la vérification du code')
    } finally {
      setIsLoading(false)
    }
  }

  // Si l'utilisateur est autorisé, afficher le contenu de l'admin
  if (isAuthorized) {
    return <>{children}</>
  }

  // Sinon, afficher le formulaire de code d'accès
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accès à l&apos;administration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Veuillez saisir le code d&apos;accès administrateur
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
              Code d&apos;accès
            </label>
            <input
              id="accessCode"
              name="accessCode"
              type="text"
              required
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Entrez votre code d'accès"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? 'Vérification...' : 'Accéder'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Retour
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
