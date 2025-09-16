/**
 * Utilitaires de formatage pour l'application
 */

/**
 * Formate un nombre en francs CFA
 * @param value - Montant à formater
 * @returns Chaîne formatée (ex: 1 000 000 FCFA)
 */
export function formatCurrency(value: number): string {
  // Format fixe pour éviter les différences serveur/client
  const formatted = value.toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
  return `${formatted} FCFA`;
}

/**
 * Formate une date en format français
 * @param date - Date à formater
 * @returns Chaîne formatée (ex: 01/01/2023)
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format fixe pour éviter les différences serveur/client
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formate une date avec l'heure en format français
 * @param date - Date à formater
 * @returns Chaîne formatée (ex: 01/01/2023 à 14:30)
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Format fixe pour éviter les différences serveur/client
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day}/${month}/${year} à ${hours}:${minutes}`;
}

/**
 * Formate un numéro de téléphone en format international
 * @param phone - Numéro de téléphone à formater
 * @returns Chaîne formatée
 */
export function formatPhoneNumber(phone: string | null): string {
  if (!phone) return 'N/A';
  
  // Format basique pour les numéros africains
  // Peut être amélioré avec une bibliothèque comme libphonenumber-js
  return phone.replace(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/, '+$1 $2 $3 $4 $5');
}

