'use client';

import { useState, useEffect } from 'react';
import { accessCodeService } from '@/lib/appwrite/access-code';

interface UseAccessCodeResult {
  isAuthorized: boolean;
  isVerifying: boolean;
  verifyAccessCode: (code: string) => Promise<boolean>;
  resetAuthorization: () => void;
}

/**
 * Hook personnalisé pour gérer la vérification des codes d'accès
 * 
 * @param expirationTimeMs - Durée de validité du code d'accès en millisecondes (défaut: 24 heures)
 * @returns Un objet contenant l'état d'autorisation et les fonctions de vérification
 */
export function useAccessCode(expirationTimeMs: number = 24 * 60 * 60 * 1000): UseAccessCodeResult {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Vérifier si le code a déjà été validé et n'a pas expiré
  useEffect(() => {
    const checkStoredAuthorization = () => {
      const storedData = localStorage.getItem('accessCodeVerified');
      
      if (storedData) {
        try {
          const { timestamp, verified } = JSON.parse(storedData);
          const now = Date.now();
          
          // Vérifier si l'autorisation est toujours valide
          if (verified && now - timestamp < expirationTimeMs) {
            setIsAuthorized(true);
          } else {
            // Supprimer l'autorisation expirée
            localStorage.removeItem('accessCodeVerified');
          }
        } catch (error) {
          // En cas d'erreur de parsing, supprimer l'entrée corrompue
          localStorage.removeItem('accessCodeVerified');
        }
      }
    };
    
    checkStoredAuthorization();
  }, [expirationTimeMs]);

  /**
   * Vérifie un code d'accès et met à jour l'état d'autorisation
   * @param code - Le code d'accès à vérifier
   * @returns true si le code est valide, false sinon
   */
  const verifyAccessCode = async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      return false;
    }

    setIsVerifying(true);
    
    try {
      const isValid = await accessCodeService.verifyAccessCode(code);
      
      if (isValid) {
        setIsAuthorized(true);
        
        // Stocker l'autorisation avec un timestamp
        localStorage.setItem('accessCodeVerified', JSON.stringify({
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
  };

  /**
   * Réinitialise l'état d'autorisation
   */
  const resetAuthorization = () => {
    setIsAuthorized(false);
    localStorage.removeItem('accessCodeVerified');
  };

  return {
    isAuthorized,
    isVerifying,
    verifyAccessCode,
    resetAuthorization
  };
}

