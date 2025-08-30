'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from './use-toast';

interface PermissionCheckProps {
  requiredRole: 'admin' | 'manager' | 'seller';
  children: ReactNode;
  fallback?: ReactNode;
  showToast?: boolean;
  toastMessage?: string;
}

/**
 * Composant qui vérifie si l'utilisateur a le rôle requis pour afficher le contenu
 * Si l'utilisateur n'a pas le rôle requis, affiche un message d'erreur ou un contenu alternatif
 */
export function PermissionCheck({
  requiredRole,
  children,
  fallback = null,
  showToast = false,
  toastMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action."
}: PermissionCheckProps) {
  const { userProfile, loading } = useAuth();
  const { toast } = useToast();

  // Si le chargement est en cours, on n'affiche rien
  if (loading) return null;

  // Vérifier si l'utilisateur a le rôle requis
  const hasPermission = userProfile && (
    // Admin a accès à tout
    userProfile.role === 'admin' ||
    // Si le rôle requis est manager, alors admin et manager ont accès
    (requiredRole === 'manager' && userProfile.role === 'manager') ||
    // Si le rôle requis est seller, alors admin, manager et seller ont accès
    (requiredRole === 'seller' && ['admin', 'manager', 'seller'].includes(userProfile.role))
  );

  // Si l'utilisateur n'a pas la permission et qu'on doit afficher un toast
  if (!hasPermission && showToast) {
    toast({
      title: "Accès refusé",
      description: toastMessage,
      variant: "destructive"
    });
  }

  // Retourner le contenu si l'utilisateur a la permission, sinon le fallback
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}