import { useState, useEffect } from 'react'

/**
 * Hook pour débouncer une valeur
 * Utile pour les recherches en temps réel afin d'éviter trop de requêtes
 * 
 * @param value La valeur à débouncer
 * @param delay Le délai en millisecondes avant que la valeur ne soit mise à jour
 * @returns La valeur debouncée
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Mettre à jour la valeur debouncée après le délai
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Annuler le timer si la valeur change (ou si le composant est démonté)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

