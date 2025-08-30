'use client';

import { useState, useEffect, useCallback } from 'react';
import { accessCodeService } from '@/lib/appwrite/access-code';

interface UseAccessCodeCheckResult {
  isAuthorized: boolean;
  isVerifying: boolean;
  showForm: boolean;
  accessCode: string;
  setAccessCode: (code: string) => void;
  setShowForm: (show: boolean) => void;
  verifyAccessCode: (e: React.FormEvent) => Promise<boolean>;
  resetAuthorization: () => void;
}

interface AccessCodeStorage {
  verified: boolean;
  timestamp: number;
}

/**
 * Hook personnalisé pour gérer la vérification des codes d'accès avec mise en cache
 * 
 * @param expirationTimeMs - Durée de validité du code d'accès en millisecondes (défaut: 24 heures)
 * @param storageType - Type de stockage à utiliser ('local' ou 'session')
 * @returns Un objet contenant l'état d'autorisation et les fonctions de vérification
 */
export function useAccessCodeCheck(
  expirationTimeMs: number = 24 * 60 * 60 * 1000,
  storageType: 'local' | 'session' = 'local'
): UseAccessCodeCheckResult {
  const [accessCode, setAccessCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  
  const storage = storageType === 'local' ? localStorage : sessionStorage;
  const storageKey = 'accessCodeVerified';

  // Vérifier si le code a déjà été validé et n'a pas expiré
  useEffect(() => {
    const checkStoredAuthorization = () => {
      const storedData = storage.getItem(storageKey);
      
      if (storedData) {
        try {
          // Pour la rétrocompatibilité avec l'ancien format
          if (storedData === 'true') {
            setIsAuthorized(true);
            return;
          }
          
          const { timestamp, verified } = JSON.parse(storedData) as AccessCodeStorage;
          const now = Date.now();
          
          // Vérifier si l'autorisation est toujours valide
          if (verified && now - timestamp < expirationTimeMs) {
            setIsAuthorized(true);
          } else {
            // Supprimer l'autorisation expirée
            storage.removeItem(storageKey);
          }
        } catch (error) {
          // En cas d'erreur de parsing, supprimer l'entrée corrompue
          storage.removeItem(storageKey);
        }
      }
    };
    
    checkStoredAuthorization();
  }, [expirationTimeMs, storage, storageKey]);

  /**
   * Vérifie un code d'accès et met à jour l'état d'autorisation
   * @param e - L'événement de formulaire
   * @returns true si le code est valide, false sinon
   */
  const verifyAccessCode = useCallback(async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    
    if (!accessCode.trim()) {
      return false;
    }

    setIsVerifying(true);
    
    try {
      const isValid = await accessCodeService.verifyAccessCode(accessCode);
      
      if (isValid) {
        setIsAuthorized(true);
        setShowForm(false);
        
        // Stocker l'autorisation avec un timestamp
        storage.setItem(storageKey, JSON.stringify({
          verified: true,
          timestamp: Date.now()
        }));
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying access code:', error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [accessCode, storage, storageKey]);

  /**
   * Réinitialise l'état d'autorisation
   */
  const resetAuthorization = useCallback(() => {
    setIsAuthorized(false);
    storage.removeItem(storageKey);
  }, [storage, storageKey]);

  return {
    isAuthorized,
    isVerifying,
    showForm,
    accessCode,
    setAccessCode,
    setShowForm,
    verifyAccessCode,
    resetAuthorization
  };
}