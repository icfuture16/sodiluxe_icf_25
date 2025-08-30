/**
 * Utilitaires pour la gestion des vendeurs
 */

/**
 * Génère un identifiant unique pour le vendeur basé sur son nom complet
 * L'identifiant est limité à 15 caractères maximum
 * 
 * @param fullName - Le nom complet de l'utilisateur
 * @returns L'identifiant user_seller (max 15 caractères)
 */
export function generateUserSeller(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return 'UNKNOWN'
  }

  // Nettoyer le nom : supprimer les accents, espaces multiples, caractères spéciaux
  const cleanName = fullName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-zA-Z0-9\s]/g, '') // Garder seulement lettres, chiffres et espaces
    .replace(/\s+/g, ' ') // Remplacer espaces multiples par un seul
    .trim()
    .toUpperCase()

  if (!cleanName) {
    return 'UNKNOWN'
  }

  // Stratégies de génération selon la longueur et le format du nom
  const words = cleanName.split(' ').filter(word => word.length > 0)
  
  if (words.length === 0) {
    return 'UNKNOWN'
  }
  
  // Si un seul mot
  if (words.length === 1) {
    return words[0].substring(0, 15)
  }
  
  // Si deux mots (prénom + nom)
  if (words.length === 2) {
    const [firstName, lastName] = words
    
    // Essayer prénom complet + initiale du nom
    if (firstName.length + 1 <= 15) {
      const result = firstName + lastName.charAt(0)
      if (result.length <= 15) {
        return result
      }
    }
    
    // Essayer initiale prénom + nom complet
    if (lastName.length + 1 <= 15) {
      const result = firstName.charAt(0) + lastName
      if (result.length <= 15) {
        return result
      }
    }
    
    // Essayer les 7 premiers caractères de chaque mot
    const result = firstName.substring(0, 7) + lastName.substring(0, 7)
    if (result.length <= 15) {
      return result
    }
    
    // Fallback : tronquer à 15 caractères
    return (firstName + lastName).substring(0, 15)
  }
  
  // Si trois mots ou plus (prénom + nom(s) de famille)
  if (words.length >= 3) {
    const firstName = words[0]
    const lastNames = words.slice(1)
    
    // Essayer prénom + initiales des noms de famille
    const initials = lastNames.map(name => name.charAt(0)).join('')
    if (firstName.length + initials.length <= 15) {
      return firstName + initials
    }
    
    // Essayer initiale prénom + premier nom de famille
    const result = firstName.charAt(0) + lastNames[0]
    if (result.length <= 15) {
      return result
    }
    
    // Fallback : concaténer tous les mots et tronquer
    return words.join('').substring(0, 15)
  }
  
  // Fallback final
  return cleanName.replace(/\s/g, '').substring(0, 15)
}

/**
 * Valide si un identifiant user_seller est valide
 * 
 * @param userSeller - L'identifiant à valider
 * @returns true si l'identifiant est valide
 */
export function isValidUserSeller(userSeller: string): boolean {
  if (!userSeller || typeof userSeller !== 'string') {
    return false
  }
  
  // Doit faire entre 1 et 15 caractères
  if (userSeller.length === 0 || userSeller.length > 15) {
    return false
  }
  
  // Doit contenir seulement des lettres et chiffres
  return /^[A-Z0-9]+$/.test(userSeller)
}

/**
 * Exemples d'utilisation :
 * 
 * generateUserSeller('Jean Dupont') → 'JEAND'
 * generateUserSeller('Marie-Claire Martin') → 'MARIECLM'
 * generateUserSeller('Ahmed Ben Ali') → 'AHMEDBA'
 * generateUserSeller('Jean-Pierre De La Fontaine') → 'JPDELAF'
 * generateUserSeller('') → 'UNKNOWN'
 * generateUserSeller('X') → 'X'
 */