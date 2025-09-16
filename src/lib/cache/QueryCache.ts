import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

interface CacheConfig {
  /** Durée de vie du cache en millisecondes */
  ttl: number
  /** Nombre maximum d'éléments dans le cache */
  maxItems: number
}

const defaultConfig: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxItems: 100,
}

export class QueryCache {
  private queryClient: QueryClient
  private config: CacheConfig

  constructor(queryClient: QueryClient, config: Partial<CacheConfig> = {}) {
    this.queryClient = queryClient
    this.config = { ...defaultConfig, ...config }
    this.setupPersistence()
  }

  private setupPersistence() {
    // Vérification plus stricte pour s'assurer que nous sommes côté client
    // et que localStorage est disponible
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      const localStoragePersister = createSyncStoragePersister({
        storage: window.localStorage,
        key: 'SILLAGE_QUERY_CACHE',
        throttleTime: 1000,
      })

      persistQueryClient({
        queryClient: this.queryClient,
        persister: localStoragePersister,
        maxAge: this.config.ttl,
        buster: process.env.NEXT_PUBLIC_APP_VERSION,
      })
    } catch (error) {
      console.error('Erreur lors de la configuration de la persistance du cache:', error);
      // Continuer sans persistance en cas d'erreur
    }
  }

  /**
   * Préfixe une clé de cache avec son namespace
   */
  private getNamespacedKey(namespace: string, key: string): string[] {
    return [namespace, ...key.split('.')]
  }

  /**
   * Invalide toutes les requêtes d'un namespace
   */
  invalidateNamespace(namespace: string) {
    return this.queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey as string[]
        return queryKey[0] === namespace
      },
    })
  }

  /**
   * Précharge des données dans le cache
   */
  prefetchQuery<T>(namespace: string, key: string, fetcher: () => Promise<T>) {
    return this.queryClient.prefetchQuery({
      queryKey: this.getNamespacedKey(namespace, key),
      queryFn: fetcher,
      staleTime: this.config.ttl,
    })
  }

  /**
   * Définit manuellement des données dans le cache
   */
  setQueryData<T>(namespace: string, key: string, data: T) {
    return this.queryClient.setQueryData(
      this.getNamespacedKey(namespace, key),
      data
    )
  }

  /**
   * Récupère des données du cache
   */
  getQueryData(namespace: string, key: string) {
    return this.queryClient.getQueryData(this.getNamespacedKey(namespace, key))
  }

  /**
   * Supprime des données du cache
   */
  removeQuery(namespace: string, key: string) {
    return this.queryClient.removeQueries({
      queryKey: this.getNamespacedKey(namespace, key),
    })
  }

  /**
   * Réinitialise tout le cache
   */
  clearCache() {
    return this.queryClient.clear()
  }

  /**
   * Vérifie si une requête est en cache et valide
   */
  isQueryFresh(namespace: string, key: string): boolean {
    const query = this.queryClient.getQueryState(this.getNamespacedKey(namespace, key))
    if (!query) return false
    
    // Vérifier si les données sont périmées en comparant dataUpdatedAt avec le staleTime configuré
    const dataAge = Date.now() - (query.dataUpdatedAt || 0)
    return dataAge <= this.config.ttl
  }

  /**
   * Récupère les statistiques du cache
   */
  getCacheStats() {
    const queries = this.queryClient.getQueryCache().findAll()
    const now = Date.now()
    const staleTime = this.config.ttl || 0
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => {
        const state = this.queryClient.getQueryState(q.queryKey)
        return state ? (state.dataUpdatedAt + staleTime <= now) : true
      }).length,
      activeQueries: queries.filter((q) => q.isActive()).length,
    }
  }
}

