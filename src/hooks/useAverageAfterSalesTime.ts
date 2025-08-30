import { useQuery } from '@tanstack/react-query';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client';
import { AfterSalesService } from '@/types/appwrite.types';
import { subMonths, startOfDay } from 'date-fns';

/**
 * Hook pour calculer le temps moyen de traitement SAV (en heures)
 * Prend en compte les SAV terminés des 2 derniers mois avec une date de fin (completionDate)
 */
export function useAverageAfterSalesTime() {
  return useQuery<number>({
    queryKey: ['averageAfterSalesTime'],
    queryFn: async () => {
      // Calculer la date limite (2 mois en arrière)
      const twoMonthsAgo = startOfDay(subMonths(new Date(), 2));
      const twoMonthsAgoISO = twoMonthsAgo.toISOString();
      
      // Récupérer les demandes SAV terminées des 2 derniers mois
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.AFTER_SALES_SERVICE,
        [
          Query.equal('status', 'terminée'),
          Query.greaterThanEqual('completionDate', twoMonthsAgoISO)
        ]
      );
      
      const services = response.documents as AfterSalesService[];
      if (!services.length) return 0;
      
      // Calculer la durée pour chaque SAV terminé avec validation des données
      const validDurations: number[] = [];
      
      services.forEach(service => {
        if (service.date && service.completionDate) {
          const start = new Date(service.date).getTime();
          const end = new Date(service.completionDate).getTime();
          
          // Vérifier que les dates sont valides et cohérentes
          if (!isNaN(start) && !isNaN(end) && end > start) {
            const durationHours = (end - start) / (1000 * 60 * 60); // Conversion en heures
            // Filtrer les durées aberrantes (plus de 30 jours = 720h)
            if (durationHours <= 720) {
              validDurations.push(durationHours);
            }
          }
        }
      });
      
      if (validDurations.length === 0) return 0;
      
      // Calculer la moyenne des durées valides
      const averageHours = validDurations.reduce((sum, duration) => sum + duration, 0) / validDurations.length;
      
      return Math.round(averageHours * 10) / 10; // Arrondir à 1 décimale
    },
    staleTime: 10 * 60 * 1000,
  });
}
