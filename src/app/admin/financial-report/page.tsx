// Ce fichier est un composant client pour le déploiement Netlify

// Directives pour le build statique (temporairement modifiées pour Netlify)
// export const dynamic = 'force-dynamic';
// export const fetchCache = 'force-no-store';
// export const revalidate = false;

import { Suspense } from 'react';
import FinancialReportClient from './FinancialReportClient';

// Page modifiée pour être compatible avec le build statique
export default function FinancialReportPage() {
  return (
    <Suspense fallback={<div>Chargement du bilan financier...</div>}>
      <FinancialReportClient />
    </Suspense>
  )
}
