/**
 * Index des hooks centralisés pour les ventes
 * 
 * Ce fichier centralise tous les exports des hooks de ventes
 * pour faciliter les imports et maintenir la compatibilité.
 */

// Hooks principaux unifiés
export {
  useSales,
  useCreateSale,
  useSale,
  useNormalSales,
  useCreditSales
} from './useSales'

// Hooks dépréciés (pour compatibilité temporaire)
export {
  useDebitSales,
  useDebitSale,
  useDebitSalesCount,
  useCreateDebitSale
} from './useDebitSales'

// Autres hooks utilitaires
export { useErrorHandler } from './useErrorHandler'
export { useCalculateLoyaltyPoints } from './useLoyaltyHistory'
export { useClients } from './useClients'
export { useStores } from './useStores'
export { useProducts } from './useProducts'

