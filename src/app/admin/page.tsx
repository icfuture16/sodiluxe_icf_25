// Ce fichier est un composant client pour le déploiement Netlify

// Directives pour le build statique (temporairement modifiées pour Netlify)
// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';
// export const revalidate = false;

// Importation du composant client qui contiendra toute la logique
import AdminClient from './AdminClient';
import { Suspense } from 'react';

// Page modifiée pour être compatible avec le build statique
export default function AdminPage() {
  return (
    <Suspense fallback={<div>Chargement de l'administration...</div>}>
      <AdminClient />
    </Suspense>
  )
}