'use client'

import ProtectedRoute from './ProtectedRoute'

/**
 * Composant wrapper pour protéger les pages qui nécessitent une authentification
 * À utiliser dans les pages principales de l'application (dashboard, ventes, etc.)
 */
export default function PageProtection({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}
