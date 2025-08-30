'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // Routes publiques qui n'ont pas besoin de protection
  const publicRoutes = ['/auth/login', '/auth/register', '/auth/register-access']
  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push('/auth/login')
    }
    if (!loading && user && isPublicRoute) {
      router.push('/')
    }
  }, [user, loading, router, isPublicRoute])

  // Affichage pendant le chargement
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      )
    )
  }

  // Si route publique, afficher le contenu sans vérification
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Si pas d'utilisateur sur route protégée, ne rien afficher (redirection en cours)
  if (!user) {
    return null
  }

  // Utilisateur connecté sur route protégée, afficher le contenu
  return <>{children}</>
}