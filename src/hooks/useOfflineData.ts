import { useState, useEffect, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';

interface UseOfflineDataOptions<T> {
  /** Clé unique pour identifier les données en cache */
  cacheKey: string;
  /** Fonction pour charger les données depuis l'API */
  fetchData: () => Promise<T>;
  /** Données par défaut à utiliser si aucune donnée n'est disponible */
  defaultData?: T;
  /** Durée de validité du cache en millisecondes (par défaut: 1 heure) */
  cacheDuration?: number;
}

interface OfflineDataCache<T> {
  data: T;
  timestamp: number;
}

/**
 * Hook pour gérer les données avec support du cache
 * Tente de charger les données depuis l'API, et utilise les données en cache en cas d'erreur
 */
export function useOfflineData<T>({ 
  cacheKey, 
  fetchData, 
  defaultData, 
  cacheDuration = 60 * 60 * 1000 // 1 heure par défaut
}: UseOfflineDataOptions<T>) {
  const [data, setData] = useState<T | undefined>(defaultData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const handleError = useErrorHandler();

  // Fonction pour sauvegarder les données dans le stockage local
  const saveToCache = useCallback((data: T) => {
    try {
      const cacheData: OfflineDataCache<T> = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`offline_data_${cacheKey}`, JSON.stringify(cacheData));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des données en cache:', err);
    }
  }, [cacheKey]);

  // Fonction pour charger les données depuis le stockage local
  const loadFromCache = useCallback((): T | undefined => {
    try {
      const cachedData = localStorage.getItem(`offline_data_${cacheKey}`);
      if (!cachedData) return undefined;

      const parsedCache: OfflineDataCache<T> = JSON.parse(cachedData);
      
      // Vérifier si le cache est encore valide
      const isExpired = Date.now() - parsedCache.timestamp > cacheDuration;
      if (isExpired) {
        // Si le cache est expiré, ne pas l'utiliser
        return undefined;
      }
      
      return parsedCache.data;
    } catch (err) {
      console.error('Erreur lors du chargement des données du cache:', err);
      return undefined;
    }
  }, [cacheKey, cacheDuration]);

  // Fonction pour charger les données
  // On tente toujours de charger depuis l'API
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Toujours essayer de charger depuis l'API
      const apiData = await fetchData();
      setData(apiData);
      saveToCache(apiData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erreur inconnue');
      setError(error);
      handleError(error, 'Impossible de charger les données');
      
      // En cas d'erreur, essayer de charger depuis le cache
      const cachedData = loadFromCache();
      if (cachedData) {
        setData(cachedData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, defaultData, handleError, saveToCache]);

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  // Fonction pour forcer le rechargement des données
  const refresh = useCallback(() => {
    return loadData();
  }, [loadData]);

  return { data, isLoading, error, refresh };
}