'use client';

import * as React from 'react';
import { ReactNode } from 'react';
import { useAccessCodeCheck } from '@/hooks/useAccessCodeCheck';
import { PencilIcon } from 'lucide-react';
import { TrashIcon } from 'lucide-react';

interface AccessCodeCheckProps {
  children: ReactNode;
  fallback?: ReactNode;
  toastMessage?: string;
  onAuthorizedClick?: () => void;
  expirationTimeMs?: number;
  storageType?: 'local' | 'session';
}

/**
 * Composant qui vérifie si l'utilisateur a saisi le bon code d'accès pour afficher le contenu
 * Utilise le même système de vérification que celui utilisé pour la création de compte
 * Si l'utilisateur n'a pas saisi le code ou a saisi un code incorrect, affiche un formulaire de saisie
 * 
 * Le code d'accès vérifié est stocké dans le localStorage avec un mécanisme d'expiration
 * pour éviter de redemander le code à chaque visite
 */
export function AccessCodeCheck({
  children,
  fallback = null,
  toastMessage = "Code d'accès incorrect. Veuillez réessayer.",
  onAuthorizedClick,
  expirationTimeMs = 24 * 60 * 60 * 1000, // 24 heures par défaut
  storageType = 'local'
}: AccessCodeCheckProps) {
  // Utiliser le hook personnalisé pour la logique de vérification et l'état du formulaire
  const {
    accessCode,
    setAccessCode,
    showForm,
    setShowForm,
    isAuthorized,
    isVerifying,
    verifyAccessCode
  } = useAccessCodeCheck(expirationTimeMs, storageType);

  /**
   * Détecte le type de bouton en fonction des icônes présentes dans les enfants
   * @param children - Les enfants du composant
   * @returns Un objet contenant des booléens pour chaque type de bouton
   */
  const detectButtonType = (children: ReactNode) => {
    const childrenArray = React.Children.toArray(children);
    
    /**
     * Vérifie si un élément est du type d'icône spécifié
     * @param element - L'élément React à vérifier
     * @param iconType - Le type d'icône à rechercher
     * @returns true si l'élément est du type d'icône spécifié, false sinon
     */
    const isIconType = (element: any, iconType: React.ComponentType<any>): boolean => {
      // Vérifier le type directement
      if (element === iconType) return true;
      
      // Vérifier par displayName si disponible
      if (iconType.displayName && 
          element && 
          typeof element === 'function' && 
          element.displayName === iconType.displayName) {
        return true;
      }
      
      return false;
    };
    
    /**
     * Vérifie si un élément ou ses enfants contiennent une icône spécifique
     * @param element - L'élément React à vérifier
     * @param iconType - Le type d'icône à rechercher
     * @returns true si l'élément ou ses enfants contiennent l'icône, false sinon
     */
    const containsIcon = (element: React.ReactNode, iconType: React.ComponentType<any>): boolean => {
      if (!React.isValidElement(element)) return false;
      
      // Vérifier si l'élément est directement l'icône recherchée
      if (isIconType(element.type, iconType)) return true;
      
      // Vérifier si l'élément a des enfants et si l'un d'eux contient l'icône
      if ('props' in element && 
          element.props && 
          typeof element.props === 'object' && 
          element.props !== null && 
          'children' in element.props) {
        const childrenArray = React.Children.toArray(element.props.children as React.ReactNode);
        return childrenArray.some(child => containsIcon(child, iconType));
      }
      
      return false;
    };
    
    // Vérifier si les enfants contiennent les icônes spécifiques
    const isEditButton = childrenArray.some(child => containsIcon(child, PencilIcon));
    const isDeleteButton = childrenArray.some(child => containsIcon(child, TrashIcon));
    
    return { isEditButton, isDeleteButton };
  };
  
  // Si l'utilisateur est autorisé, afficher le contenu avec le style approprié
  if (isAuthorized) {
    const { isEditButton, isDeleteButton } = detectButtonType(children);
    
    // Appliquer le style approprié en fonction du type de bouton
    if (isEditButton) {
      return (
        <button
          onClick={onAuthorizedClick}
          className="text-primary hover:text-primary/80"
        >
          {children}
        </button>
      );
    } else if (isDeleteButton) {
      return (
        <button
          onClick={onAuthorizedClick}
          className="text-red-600 hover:text-red-800"
        >
          {children}
        </button>
      );
    } else {
      // Style par défaut pour le bouton d'ajout
      return (
        <button
          onClick={onAuthorizedClick}
          className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {children}
        </button>
      );
    }
  }

  // Si le formulaire est affiché, montrer le formulaire de saisie du code d'accès
  if (showForm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="p-6 max-w-md w-full mx-auto bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Accès restreint</h2>
          <p className="mb-4 text-gray-600">Veuillez saisir le code d'accès pour continuer.</p>
          
          <form onSubmit={verifyAccessCode} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700">
                Code d'accès
              </label>
              <input
                type="text"
                id="accessCode"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="Entrez le code d'accès"
                required
                autoFocus
              />
            </div>
            
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isVerifying ? 'Vérification...' : 'Valider'}
              </button>
            </div>
          </form>
          
          {fallback && <div className="mt-4">{fallback}</div>}
        </div>
      </div>
    );
  }

  // Sinon, afficher un bouton pour demander le code d'accès
  return (
    <button
      onClick={() => setShowForm(true)}
      className="inline-flex items-center gap-x-2 rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {children}
    </button>
  );
}