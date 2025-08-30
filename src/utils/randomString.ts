/**
 * Génère une chaîne aléatoire de caractères alphanumériques
 * @param length - Longueur de la chaîne à générer
 * @returns Chaîne aléatoire
 */
export function generateRandomString(length: number = 5): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}