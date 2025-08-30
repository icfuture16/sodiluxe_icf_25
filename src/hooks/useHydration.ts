import { useEffect, useState } from 'react'

/**
 * Hook pour gérer l'hydratation côté client de manière sûre
 * Évite les erreurs d'hydratation en s'assurant que le rendu initial
 * côté serveur correspond au rendu côté client
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}