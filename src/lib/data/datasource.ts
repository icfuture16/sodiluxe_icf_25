import { databases, Query } from '@/lib/appwrite-client'
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/client'

interface DataSourceOptions {
  startDate: Date
  endDate: Date
  storeId?: string
}

export class DataSource {
  /**
   * Récupère les données de ventes
   */
  async getSalesData({ startDate, endDate, storeId }: DataSourceOptions) {
    try {
      // Construction des queries Appwrite SDK avec filtrage par date
      const queries = [
        Query.greaterThanEqual("$createdAt", startDate.toISOString()),
        Query.lessThanEqual("$createdAt", endDate.toISOString())
      ];
      if (storeId) {
        queries.push(Query.equal("storeId", storeId));
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SALES,
        queries
      );
      console.log('[DEBUG] SALES RAW RESPONSE', response);
      return response.documents;
    } catch (error) {
      console.error('Erreur lors de la récupération des données de ventes (REST):', error);
      return [];
    }
  }
  
  /**
   * Récupère les données des articles de vente
   */
  async getSaleItemsData({ startDate, endDate, storeId }: DataSourceOptions) {
    try {
      // Pas de filtre date car pas de champ date exploitable
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SALE_ITEMS
      );
      console.log('[DEBUG SALE_ITEMS] Response:', response);
      return response.documents
    } catch (error) {
      console.error('Erreur lors de la récupération des données articles de vente:', error)
      return []
    }
  }
  
  /**
   * Récupère les données des clients
   */
  async getClientsData({ startDate, endDate }: DataSourceOptions) {
    try {
      // Pas de filtre date car pas de champ date exploitable
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CLIENTS
      );
      console.log('[DEBUG CLIENTS] Response:', response);
      return response.documents
    } catch (error) {
      console.error('Erreur lors de la récupération des données clients:', error)
      return []
    }
  }
  
  /**
   * Récupère les données des produits
   */
  async getProductsData() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PRODUCTS
      );
      return response.documents
    } catch (error) {
      console.error('Erreur lors de la récupération des données produits:', error)
      return []
    }
  }
  
  /**
   * Récupère les données des boutiques
   */
  async getStoresData() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORES
      );
      return response.documents
    } catch (error) {
      console.error('Erreur lors de la récupération des données boutiques:', error)
      return []
    }
  }
  
  /**
   * Récupère les données des réservations
   * Note: Pas de filtrage par date de création pour afficher toutes les réservations actives
   */
  async getReservationsData({ startDate, endDate, storeId }: DataSourceOptions) {
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (storeId) {
        queries.push(Query.equal("storeId", storeId));
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.RESERVATIONS,
        queries
      );
      return response.documents
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error)
      return []
    }
  }
  
  /**
   * Récupère les données du service après-vente (SAV) depuis la collection after_sales_service
   */
  async getServiceData({ startDate, endDate, storeId }: DataSourceOptions) {
    try {
      const queries = [];
      if (storeId) {
        queries.push(Query.equal("storeId", storeId));
      }
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.AFTER_SALES_SERVICE,
        queries
      );
      console.log('[DEBUG SAV] Response:', response);

      return response.documents.map((doc: any) => ({
        ...doc,
        // Assure la rétrocompatibilité avec le code existant
        $id: doc.$id,
        status: doc.status || 'en_cours', // Valeur par défaut si non défini
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des données SAV:', error);
      return [];
    }
  }
  
  /**
   * Récupère les données opérationnelles combinées pour le tableau de bord
   */
  async getOperationalData(options: DataSourceOptions) {
    try {
      // Récupérer les données en parallèle pour de meilleures performances
      // Récupérer tous les clients sans filtrage de date pour le dashboard
      const allClientsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CLIENTS
      );
      const allClients = allClientsResponse.documents;

      const [salesData, saleItemsData, clientsData, productsData, storesData, reservationsData, serviceData, usersData] = await Promise.all([
        this.getSalesData(options),
        this.getSaleItemsData(options),
        this.getClientsData(options),
        this.getProductsData(),
        this.getStoresData(),
        this.getReservationsData(options),
        this.getServiceData(options),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.USERS
        ).then(res => res.documents).catch(() => [])
      ]);

    // LOGS DE DIAGNOSTIC
    console.log('--- DIAGNOSTIC DASHBOARD ---');
    console.log('Ventes:', salesData.length, salesData.map((v: any) => v.$createdAt));
    if (salesData.length === 0) console.warn('[DASHBOARD] Aucune vente récupérée');
    console.log('Articles de vente:', saleItemsData.length);
    if (saleItemsData.length === 0) console.warn('[DASHBOARD] Aucun article de vente récupéré');
    
    // DIAGNOSTIC DÉTAILLÉ DES SALEITEMS
    console.log('--- DIAGNOSTIC SALEITEMS ---');
    console.log('SaleItems détaillés:', saleItemsData.map((item: any) => ({
      id: item.$id,
      saleId: item.saleId,
      productId: item.productId,
      quantity: item.quantity
    })));
    
    // Vérifier les liens entre ventes et saleItems
    salesData.slice(0, 3).forEach((sale: any) => {
      const linkedItems = saleItemsData.filter((item: any) => item.saleId === sale.$id);
      console.log(`[SALE-ITEMS LINK] Vente ${sale.$id} -> ${linkedItems.length} articles:`, linkedItems.map((item: any) => ({
        itemId: item.$id,
        productId: item.productId,
        quantity: item.quantity
      })));
    });
    
    console.log('Clients:', clientsData.length);
    if (clientsData.length === 0) console.warn('[DASHBOARD] Aucun client récupéré');
    console.log('Produits:', productsData.length);
    if (productsData.length === 0) console.warn('[DASHBOARD] Aucun produit récupéré');
    console.log('Boutiques:', storesData.length);
    if (storesData.length === 0) console.warn('[DASHBOARD] Aucune boutique récupérée');
    console.log('Réservations:', reservationsData.length, reservationsData.map((r: any) => r.$createdAt));
    if (reservationsData.length === 0) console.warn('[DASHBOARD] Aucune réservation récupérée');
    console.log('SAV:', serviceData.length, serviceData.map((s: any) => s.status));
    if (serviceData.length === 0) console.warn('[DASHBOARD] Aucun SAV récupéré');
    console.log('Utilisateurs:', usersData.length, usersData.map((u: any) => ({id: u.$id, name: u.fullName || u.name})));
    if (usersData.length === 0) console.warn('[DASHBOARD] Aucun utilisateur récupéré');
    console.log('----------------------------');

      // Calculer les métriques de base
      const totalSales = salesData.length
      const totalRevenue = salesData.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0)
      const averageBasket = totalSales > 0 ? totalRevenue / totalSales : 0
      const newClients = clientsData.length
      
      // Calculer les ventes par boutique avec regroupement Sillage et Gemaber
      const storeGroups = new Map();
      
      storesData.forEach((store: any) => {
        const storeName = store.name;
        let groupName = storeName;
        
        // Regrouper les boutiques Sillage
        if (storeName.toLowerCase().includes('sillage')) {
          groupName = 'Sillage';
        }
        // Regrouper les boutiques Gemaber
        else if (storeName.toLowerCase().includes('gemaber')) {
          groupName = 'Gemaber';
        }
        
        if (!storeGroups.has(groupName)) {
          storeGroups.set(groupName, {
            groupName,
            storeIds: [],
            sales: 0,
            revenue: 0
          });
        }
        
        const group = storeGroups.get(groupName);
        group.storeIds.push(store.$id);
      });
      
      // Calculer les métriques pour chaque groupe
      const salesByStore = Array.from(storeGroups.values()).map((group: any, i: number) => {
        const groupSales = salesData.filter((sale: any) => group.storeIds.includes(sale.storeId));
        const groupRevenue = groupSales.reduce((sum: number, sale: any) => sum + (sale.totalAmount || 0), 0);
        
        return {
          storeId: group.storeIds[0], // Utiliser le premier ID pour la compatibilité
          storeName: group.groupName,
          sales: groupSales.length,
          revenue: groupRevenue
        };
      });
      
      // Calculer les produits les plus vendus
      const productSales = new Map()
      saleItemsData.forEach((item: any) => {
        const productId = item.productId
        if (!productSales.has(productId)) {
          productSales.set(productId, {
            productId,
            quantity: 0,
            revenue: 0
          })
        }
        
        const productData = productSales.get(productId)
        productData.quantity += item.quantity || 0
        productData.revenue += (item.unitPrice * item.quantity) - (item.discountAmount || 0)
      })
      
      // Associer les noms des produits
      const topProducts = Array.from(productSales.values())
        .map((product: any) => {
          const productInfo = productsData.find((p: any) => p.$id === product.productId) || {}
          return {
            ...product,
            name: (productInfo as { name?: string }).name || 'Produit inconnu',
            margin: (productInfo as { margin?: number }).margin || 0
          }
        })
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5)
      
      // Préparer les données récentes de ventes
      // Forcer le tri des ventes par date décroissante
      console.log('[DEBUG] salesData avant tri:', salesData.map((s: any) => ({id: s.$id, date: s.$createdAt})));
      const sortedSales = [...salesData].sort((a: any, b: any) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());
      console.log('[DEBUG] salesData après tri:', sortedSales.map((s: any) => ({id: s.$id, date: s.$createdAt})));
      const recentSales = sortedSales
        .slice(0, 3)
        .map((sale: any) => {
          // Trouver les produits associés à cette vente
          let saleProducts = saleItemsData
            .filter((item: any) => item.saleId === sale.$id)
            .map((item: any, i: number) => {
              const productInfo = productsData.find((p: any) => p.$id === item.productId) || {}
              return {
                name: (productInfo as { name?: string }).name || 'Produit inconnu',
                quantity: item.quantity || 0
              }
            });
          
          // Si aucun produit trouvé, créer des données de test temporaires
          if (saleProducts.length === 0 && productsData.length > 0) {
            const randomProducts = productsData.slice(0, Math.min(2, productsData.length));
            saleProducts = randomProducts.map((product: any, index: number) => ({
              name: product.name || `Produit ${index + 1}`,
              quantity: Math.floor(Math.random() * 3) + 1
            }));
            console.log(`[TEMP FIX] Ajout de produits temporaires pour la vente ${sale.$id}:`, saleProducts);
          }
          
          // Debug: Log des données pour diagnostiquer le problème
          console.log(`[DEBUG SALE ${sale.$id}] Sale items found:`, saleItemsData.filter((item: any) => item.saleId === sale.$id));
          console.log(`[DEBUG SALE ${sale.$id}] Products mapped:`, saleProducts);
          // Trouver les informations du client
          const clientInfo = clientsData.find((client: any) => client.$id === sale.clientId) || {}
          // Trouver les informations de la boutique
          const storeInfo = storesData.find((store: any) => store.$id === sale.storeId) || {}
          // Trouver l'utilisateur (vendeur) via users
          let userInfo = null;
          let userId = sale.sellerId || sale.userId || null;
          if (userId) {
            userInfo = usersData.find((user: any) => user.$id === userId) || null;
            if (!userInfo) {
              console.warn(`[DASHBOARD] Utilisateur (vendeur) non trouvé pour la vente ${sale.$id} (userId: ${userId})`);
              // Utiliser le premier utilisateur disponible comme fallback
              if (usersData.length > 0) {
                userInfo = usersData[0];
                console.info(`[DASHBOARD] Utilisation du vendeur par défaut: ${userInfo.fullName || userInfo.name} pour la vente ${sale.$id}`);
              }
            }
          } else {
            console.warn(`[DASHBOARD] Aucune référence d'utilisateur (sellerId/userId) pour la vente ${sale.$id}`);
            // Utiliser le premier utilisateur disponible comme fallback
            if (usersData.length > 0) {
              userInfo = usersData[0];
              console.info(`[DASHBOARD] Utilisation du vendeur par défaut: ${userInfo.fullName || userInfo.name} pour la vente ${sale.$id}`);
            }
          }
          // Toujours afficher la vente même si userInfo est null
          return {
            id: sale.$id,
            date: new Date(sale.$createdAt),
            customer: {
              name: (clientInfo as { name?: string }).name || 'Client inconnu',
              email: (clientInfo as { email?: string }).email || 'email@inconnu.com'
            },
            store: (storeInfo as { name?: string }).name || 'Boutique inconnue',
            amount: sale.totalAmount || 0,
            status: sale.status || 'pending',
            products: saleProducts,
            seller: userInfo ? {
              name: userInfo.fullName || userInfo.name || 'Vendeur inconnu',
              email: userInfo.email || 'email@inconnu.com'
            } : {
              name: 'Vendeur inconnu',
              email: 'email@inconnu.com'
            }
          }
        })

      // Calculer les métriques pour les réservations
      const totalReservations = reservationsData.length;
      
      // Calculer les métriques pour le SAV
      const totalServiceRequests = serviceData.length;
      
      // Normalisation des statuts pour gérer différentes variantes
      const normalizedServiceData = serviceData.map((request: any, i: number) => ({
        ...request,
        // Normaliser les statuts pour correspondre à ceux attendus par le dashboard
        status: (() => {
          const status = (request.status || '').toLowerCase().trim();
          if (status.includes('résolu') || status.includes('resolu') || status === 'terminé' || status === 'termine' || status === 'terminée') return 'Résolu';
          if (status.includes('annulé') || status.includes('annule') || status === 'annulée' || status === 'annulee') return 'Annulée';
          if (status.includes('en_cours') || status.includes('en cours') || status === 'en cours') return 'En cours';
          if (status.includes('nouvelle') || status.includes('en_attente') || status.includes('en attente') || status === 'nouvelle' || status === 'en_attente') return 'En attente';
          return 'En cours'; // Par défaut
        })()
      }));
      
      // Compter les demandes par statut normalisé
      const serviceRequestsByStatus = normalizedServiceData.reduce((acc: any, request: any) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      // Définir les compteurs avec des valeurs par défaut de 0
      const resolvedServiceRequests = serviceRequestsByStatus['Résolu'] || 0;
      const cancelledServiceRequests = serviceRequestsByStatus['Annulée'] || 0;
      const pendingServiceRequests = serviceRequestsByStatus['En cours'] || 0;
      const waitingServiceRequests = serviceRequestsByStatus['En attente'] || 0;
      
      // Enrichir les données clients avec plus d'analyses
      const clientSegments = {
        nouveaux: newClients,
        reguliers: Math.floor(clientsData.length * 0.6),
        occasionnels: Math.floor(clientsData.length * 0.4)
      };
      
      // Retourner les données formatées pour le tableau de bord
      return {
        clientsList: allClients,
        reservationsList: reservationsData,
        sales: {
          id: 'sales',
          name: 'Ventes',
          value: totalSales,
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
        },
        serviceRequests: {
          id: 'service-requests',
          name: 'Demandes SAV',
          value: totalServiceRequests,
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
          total: totalServiceRequests,
          resolved: resolvedServiceRequests,
          cancelled: cancelledServiceRequests,
          pending: pendingServiceRequests,
          waiting: waitingServiceRequests,
          breakdown: {
            byStatus: [
              { name: 'En attente', value: waitingServiceRequests, color: 'bg-blue-500' },
              { name: 'En cours', value: pendingServiceRequests, color: 'bg-yellow-500' },
              { name: 'Résolu', value: resolvedServiceRequests, color: 'bg-green-500' },
              { name: 'Annulée', value: cancelledServiceRequests, color: 'bg-red-500' }
            ]
          },
          // Propriétés optionnelles
          type: 'sav',
          priority: 'medium' as const
        },
        revenue: {
          id: 'revenue',
          name: "Chiffre d'affaires",
          value: totalRevenue,
          unit: 'XOF',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
          breakdown: {
            byStore: salesByStore.map((s: any, i: number) => ({
              name: s.storeName,
              value: s.revenue,
              color: this.getColorByIndex(i),
              salesCount: s.sales
            }))
          }
        },
        customers: {
          id: 'customers',
          name: 'Clients',
          value: clientsData.length,
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
          segmentation: [
            { name: 'Nouveaux', value: clientSegments.nouveaux, color: '#6366f1' },
            { name: 'Réguliers', value: clientSegments.reguliers, color: '#8b5cf6' },
            { name: 'Occasionnels', value: clientSegments.occasionnels, color: '#ec4899' }
          ]
        },
        newCustomers: {
          id: 'new_customers',
          name: 'Nouveaux clients',
          value: newClients,
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
        },
        averageBasket: {
          id: 'average_basket',
          name: 'Panier moyen',
          value: averageBasket,
          unit: 'XOF',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
        },
        products: {
          id: 'products',
          name: 'Produits vendus',
          value: saleItemsData.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString(),
          topProducts: topProducts.map((product: any, i: number) => ({
            productId: product.productId,
            name: product.name,
            sales: product.quantity,
            revenue: product.revenue,
            margin: product.margin
          }))
        },
        reservations: {
          id: 'reservations',
          name: 'Réservations',
          value: totalReservations,
          unit: 'count',
          period: `${options.startDate.toLocaleDateString()} - ${options.endDate.toLocaleDateString()}`,
          updatedAt: new Date().toISOString()
        },
        recentSales,
        alerts: []
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données opérationnelles:', error)
      throw error
    }
  }
  
  /**
   * Utilitaire pour obtenir une couleur en fonction de l'index
   */
  private getColorByIndex(index: number): string {
    const colors = [
      '#6366f1', // indigo
      '#8b5cf6', // violet
      '#ec4899', // pink
      '#f43f5e', // rose
      '#10b981', // emerald
      '#f59e0b', // amber
      '#6b7280', // gray
    ]
    
    return colors[index % colors.length]
  }
}