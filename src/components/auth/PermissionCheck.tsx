'use client'

import { useAuth } from '@/hooks/useAuth'
import { ReactNode } from 'react'

interface PermissionCheckProps {
  children: ReactNode
  requiredRole?: 'admin' | 'user'
  fallback?: ReactNode
}

export function PermissionCheck({ 
  children, 
  requiredRole = 'admin', 
  fallback = null 
}: PermissionCheckProps) {
  const { userProfile } = useAuth()

  // Si aucun utilisateur n'est connecté ou n'a pas de profil, ne pas afficher le contenu
  if (!userProfile) {
    return <>{fallback}</>
  }

  // Vérifier si l'utilisateur a le rôle requis
  if (requiredRole === 'admin' && userProfile.role !== 'admin') {
    return <>{fallback}</>
  }

  // Afficher le contenu si les permissions sont correctes
  return <>{children}</>
}

export default PermissionCheck