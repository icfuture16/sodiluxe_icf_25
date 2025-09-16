import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/use-toast'
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/lib/appwrite/client'

// Types
export interface StockLevel {
  id: string
  productId: string
  productName: string
  productSku: string
  categoryId: string
  categoryName: string
  storeId: string
  storeName: string
  quantity: number
  minQuantity: number
  maxQuantity: number
  status: 'normal' | 'low' | 'out_of_stock' | 'excess'
  lastUpdated: string
  unitCost: number
  totalValue: number
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  productSku: string
  movementType: 'entry' | 'exit' | 'transfer' | 'adjustment'
  quantity: number
  sourceStoreId: string | null
  sourceStoreName: string | null
  destinationStoreId: string | null
  destinationStoreName: string | null
  reason: string
  notes: string | null
  createdBy: string
  createdAt: string
  documentReference?: string
}

export interface Inventory {
  id: string
  name: string
  storeId: string
  storeName: string
  inventoryType: 'full' | 'partial' | 'cycle'
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: string
  startDate: string | null
  endDate: string | null
  categories: string[] | null
  totalItems: number
  countedItems: number
  discrepancies: number
  notes: string | null
  createdBy: string
  createdAt: string
  blockSales: boolean
  blockMovements: boolean
}

export interface StockAlert {
  id: string
  type: 'low_stock' | 'out_of_stock' | 'excess_stock' | 'expiration' | 'discrepancy'
  severity: 'info' | 'warning' | 'critical'
  productId: string
  productName: string
  productSku: string
  storeId: string
  storeName: string
  message: string
  quantity?: number
  threshold?: number
  createdAt: string
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: string
}

export interface StockAnalytics {
  total_value: number
  low_stock_count: number
  out_of_stock_count: number
  normal_stock_count: number
  excess_stock_count: number
  inventory_turnover: number
  top_moving_products: {
    product_id: string
    product_name: string
    total_quantity: number
  }[]
  slow_moving_products: {
    product_id: string
    product_name: string
    category: string
    days_without_movement: number
    quantity: number
    value: number
  }[]
  stock_value_trend: {
    date: string
    value: number
  }[]
  alerts: StockAlert[]
}

// API functions
async function fetchStockLevels(storeId?: string, categoryId?: string, status?: string, search?: string) {
  console.log('Fetching stock levels with filters:', { storeId, categoryId, status, search })
  
  try {
    // Construire les requêtes pour Appwrite
    const queries = []
    
    if (storeId) {
      queries.push(Query.equal('storeId', storeId))
    }
    
    if (categoryId) {
      queries.push(Query.equal('categoryId', categoryId))
    }
    
    if (status) {
      queries.push(Query.equal('status', status))
    }
    
    // Récupérer les données de stock depuis Appwrite
    const stockResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES,
      queries
    )
    
    // Récupérer les produits pour obtenir les informations détaillées
    const productsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      []
    )
    
    // Récupérer les magasins pour obtenir les noms
    const storesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      []
    )
    
    // Récupérer les catégories pour obtenir les noms
    const categoriesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      []
    )
    
    const products = productsResponse.documents || []
    const stores = storesResponse.documents || []
    const categories = categoriesResponse.documents || []
    
    // Transformer les données brutes en StockLevel[]
    let stockLevels = (stockResponse.documents || []).map(stock => {
      // Trouver les informations associées
      const product = products.find(p => p.$id === stock.productId) || {}
      const store = stores.find(s => s.$id === stock.storeId) || {}
      // Vérifier si product a une propriété category avant de l'utiliser
      const category = product && 'category' in product ? categories.find(c => c.$id === product.category) || {} : {}
      
      // Déterminer le statut du stock
      let status = 'normal'
      if (stock.quantity <= 0) {
        status = 'out_of_stock'
      } else if (stock.quantity < stock.minQuantity) {
        status = 'low'
      } else if (stock.quantity > stock.maxQuantity) {
        status = 'excess'
      }
      
      // Calculer la valeur totale
      // Vérifier si product a une propriété unitCost avant de l'utiliser
      const unitCost = product && 'unitCost' in product ? (product.unitCost as number) : 0
      const totalValue = stock.quantity * unitCost
      
      return {
        id: stock.$id,
        productId: stock.productId,
        productName: product && 'name' in product ? product.name : 'Produit inconnu',
        productSku: product && 'sku' in product ? product.sku : '',
        categoryId: product && 'category' in product ? product.category : '',
        categoryName: category && 'name' in category ? category.name : 'Catégorie inconnue',
        storeId: stock.storeId,
        storeName: store && 'name' in store ? store.name : 'Magasin inconnu',
        quantity: stock.quantity || 0,
        minQuantity: stock.minQuantity || 0,
        maxQuantity: stock.maxQuantity || 0,
        status,
        lastUpdated: stock.$updatedAt || stock.$createdAt,
        unitCost: unitCost,
        totalValue
      }
    })
    
    // Filtrer par recherche si nécessaire
    if (search) {
      const searchLower = search.toLowerCase()
      stockLevels = stockLevels.filter(item => {
        const productName = typeof item.productName === 'string' ? item.productName.toLowerCase() : '';
        const productSku = typeof item.productSku === 'string' ? item.productSku.toLowerCase() : '';
        return productName.includes(searchLower) || productSku.includes(searchLower);
      })
    }
    
    return stockLevels
  } catch (error) {
    console.error('Erreur lors de la récupération des niveaux de stock:', error)
    return []
  }
  
  // Filtrer les résultats
  let filteredData = []
  
  if (storeId) {
    filteredData = filteredData.filter(item => item.storeId === storeId)
  }
  
  if (categoryId) {
    filteredData = filteredData.filter(item => item.categoryId === categoryId)
  }
  
  if (status) {
    filteredData = filteredData.filter(item => item.status === status)
  }
  
  if (search && typeof search === 'string') {
    // Use non-null assertion since we've already checked that search is a string
    const searchLower = search!.toLowerCase()
    filteredData = filteredData.filter(item => {
      const productName = typeof item.productName === 'string' ? item.productName.toLowerCase() : '';
      const productSku = typeof item.productSku === 'string' ? item.productSku.toLowerCase() : '';
      return productName.includes(searchLower) || productSku.includes(searchLower);
    })
  }
  
  return filteredData
}

async function fetchStockMovements(filters: {
  storeId?: string
  productId?: string
  movementType?: string
  startDate?: string
  endDate?: string
  search?: string
}) {
  console.log('Fetching stock movements with filters:', filters)
  
  try {
    // Construire les requêtes pour Appwrite
    const queries = []
    
    if (filters.productId) {
      queries.push(Query.equal('productId', filters.productId))
    }
    
    if (filters.movementType) {
      queries.push(Query.equal('movementType', filters.movementType))
    }
    
    if (filters.startDate) {
      queries.push(Query.greaterThanEqual('$createdAt', filters.startDate))
    }
    
    if (filters.endDate) {
      queries.push(Query.lessThanEqual('$createdAt', filters.endDate))
    }
    
    // Récupérer les mouvements de stock depuis Appwrite
    const movementsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES_MOVEMENTS,
      queries
    )
    
    // Récupérer les produits pour obtenir les informations détaillées
    const productsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      []
    )
    
    // Récupérer les magasins pour obtenir les noms
    const storesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      []
    )
    
    const products = productsResponse.documents || []
    const stores = storesResponse.documents || []
    
    // Transformer les données brutes en StockMovement[]
    let stockMovements = (movementsResponse.documents || []).map(movement => {
      // Trouver les informations associées
      const product = products.find(p => p.$id === movement.productId) || {}
      const sourceStore = movement.sourceStoreId ? stores.find(s => s.$id === movement.sourceStoreId) : null
      const destinationStore = movement.destinationStoreId ? stores.find(s => s.$id === movement.destinationStoreId) : null
      
      return {
        id: movement.$id,
        productId: movement.productId,
        productName: product && 'name' in product ? product.name : 'Produit inconnu',
        productSku: product && 'sku' in product ? product.sku : '',
        movementType: movement.movementType,
        quantity: movement.quantity || 0,
        sourceStoreId: movement.sourceStoreId || null,
        sourceStoreName: sourceStore?.name || null,
        destinationStoreId: movement.destinationStoreId || null,
        destinationStoreName: destinationStore?.name || null,
        reason: movement.reason || '',
        notes: movement.notes || null,
        createdBy: movement.createdBy || 'Utilisateur inconnu',
        createdAt: movement.$createdAt,
        documentReference: movement.documentReference || ''
      }
    })
    
    // Filtrer par magasin si nécessaire
    if (filters.storeId) {
      stockMovements = stockMovements.filter(item => 
        item.sourceStoreId === filters.storeId || item.destinationStoreId === filters.storeId
      )
    }
    
    // Filtrer par recherche si nécessaire
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      stockMovements = stockMovements.filter(item => {
        const productName = typeof item.productName === 'string' ? item.productName : '';
        const productSku = typeof item.productSku === 'string' ? item.productSku : '';
        const documentRef = typeof item.documentReference === 'string' ? item.documentReference : '';
        
        return productName.toLowerCase().includes(searchLower) || 
               productSku.toLowerCase().includes(searchLower) ||
               (item.documentReference && documentRef.toLowerCase().includes(searchLower));
      })
    }
    
    return stockMovements
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de stock:', error)
    return []
  }
  
  // Filtrer les résultats
  let filteredData = []
  
  if (filters.storeId) {
    filteredData = filteredData.filter(item => 
      item.sourceStoreId === filters.storeId || item.destinationStoreId === filters.storeId
    )
  }
  
  if (filters.productId) {
    filteredData = filteredData.filter(item => item.productId === filters.productId)
  }
  
  if (filters.movementType) {
    filteredData = filteredData.filter(item => item.movementType === filters.movementType)
  }
  
  if (filters.startDate) {
    const startDate = new Date(filters.startDate as string)
    filteredData = filteredData.filter(item => new Date(item.createdAt) >= startDate)
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate as string)
    filteredData = filteredData.filter(item => new Date(item.createdAt) <= endDate)
  }
  
  if (filters.search) {
    const searchLower = (filters.search as string).toLowerCase()
    filteredData = filteredData.filter(item => {
      const productName = typeof item.productName === 'string' ? item.productName : '';
      const productSku = typeof item.productSku === 'string' ? item.productSku : '';
      const documentRef = typeof item.documentReference === 'string' ? item.documentReference : '';
      
      return productName.toLowerCase().includes(searchLower) || 
             productSku.toLowerCase().includes(searchLower) ||
             (item.documentReference && documentRef.toLowerCase().includes(searchLower));
    })
  }
  
  return filteredData
}

async function fetchInventories(filters: {
  storeId?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  console.log('Fetching inventories with filters:', filters)
  
  try {
    // Construire les requêtes pour Appwrite
    const queries = []
    
    if (filters.storeId) {
      queries.push(Query.equal('storeId', filters.storeId))
    }
    
    if (filters.status) {
      queries.push(Query.equal('status', filters.status))
    }
    
    if (filters.startDate) {
      queries.push(Query.greaterThanEqual('scheduledDate', filters.startDate))
    }
    
    if (filters.endDate) {
      queries.push(Query.lessThanEqual('scheduledDate', filters.endDate))
    }
    
    // Récupérer les inventaires depuis Appwrite
    const inventoriesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES,
      queries
    )
    
    // Récupérer les magasins pour obtenir les noms
    const storesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      []
    )
    
    const stores = storesResponse.documents || []
    
    // Transformer les données brutes en Inventory[]
    const inventories = (inventoriesResponse.documents || []).map(inventory => {
      // Trouver les informations du magasin
      const store = stores.find(s => s.$id === inventory.storeId) || {}
      const storeName = typeof store === 'object' && store !== null && 'name' in store ? store.name : 'Magasin inconnu'
      
      return {
        id: inventory.$id,
        name: inventory.name || 'Inventaire sans nom',
        storeId: inventory.storeId,
        storeName,
        inventoryType: inventory.inventoryType || 'full',
        status: inventory.status || 'scheduled',
        scheduledDate: inventory.scheduledDate,
        startDate: inventory.startDate || null,
        endDate: inventory.endDate || null,
        categories: inventory.categories || null,
        totalItems: inventory.totalItems || 0,
        countedItems: inventory.countedItems || 0,
        discrepancies: inventory.discrepancies || 0,
        notes: inventory.notes || null,
        createdBy: inventory.createdBy || 'Utilisateur inconnu',
        createdAt: inventory.$createdAt,
        blockSales: inventory.blockSales || false,
        blockMovements: inventory.blockMovements || false
      }
    })
    
    return inventories
  } catch (error) {
    console.error('Erreur lors de la récupération des inventaires:', error)
    return []
  }
  
  // Filtrer les résultats
  let filteredData = []
  
  if (filters.storeId) {
    filteredData = filteredData.filter(item => item.storeId === filters.storeId)
  }
  
  if (filters.status) {
    filteredData = filteredData.filter(item => item.status === filters.status)
  }
  
  if (filters.startDate) {
    const startDate = new Date(filters.startDate as string)
    filteredData = filteredData.filter(item => new Date(item.scheduledDate) >= startDate)
  }
  
  if (filters.endDate) {
    const endDate = new Date(filters.endDate as string)
    filteredData = filteredData.filter(item => new Date(item.scheduledDate) <= endDate)
  }
  
  return filteredData
}

async function fetchStockAlerts(filters: {
  storeId?: string
  severity?: string
  type?: string
  acknowledged?: boolean
}) {
  console.log('Fetching stock alerts with filters:', filters)
  
  try {
    // Construire les requêtes pour Appwrite
    const queries = []
    
    if (filters.storeId) {
      queries.push(Query.equal('storeId', filters.storeId))
    }
    
    if (filters.severity) {
      queries.push(Query.equal('severity', filters.severity))
    }
    
    if (filters.type) {
      queries.push(Query.equal('type', filters.type))
    }
    
    if (filters.acknowledged !== undefined) {
      queries.push(Query.equal('acknowledged', filters.acknowledged))
    }
    
    // Récupérer les alertes de stock depuis Appwrite
    const alertsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES_ALERTS,
      queries
    )
    
    // Récupérer les produits pour obtenir les noms et SKUs
    const productsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      []
    )
    
    // Récupérer les magasins pour obtenir les noms
    const storesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      []
    )
    
    const products = productsResponse.documents || []
    const stores = storesResponse.documents || []
    
    // Transformer les données brutes en StockAlert[]
    const alerts = (alertsResponse.documents || []).map(alert => {
      // Trouver les informations du produit et du magasin
      const product = products.find(p => p.$id === alert.productId) || {}
      const store = stores.find(s => s.$id === alert.storeId) || {}
      
      const productName = typeof product === 'object' && product !== null && 'name' in product ? product.name : 'Produit inconnu'
      const productSku = typeof product === 'object' && product !== null && 'sku' in product ? product.sku : ''
      const storeName = typeof store === 'object' && store !== null && 'name' in store ? store.name : 'Magasin inconnu'
      
      return {
        id: alert.$id,
        type: alert.type,
        severity: alert.severity,
        productId: alert.productId,
        productName,
        productSku,
        storeId: alert.storeId,
        storeName,
        message: alert.message,
        quantity: alert.quantity,
        threshold: alert.threshold,
        createdAt: alert.$createdAt,
        acknowledged: alert.acknowledged || false,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      }
    })
    
    return alerts
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes de stock:', error)
    return []
  }
  
  // Filtrer les résultats
  let filteredData = []
  
  if (filters.storeId) {
    filteredData = filteredData.filter(item => item.storeId === filters.storeId)
  }
  
  if (filters.severity) {
    filteredData = filteredData.filter(item => item.severity === filters.severity)
  }
  
  if (filters.type) {
    filteredData = filteredData.filter(item => item.type === filters.type)
  }
  
  if (filters.acknowledged !== undefined) {
    filteredData = filteredData.filter(item => item.acknowledged === filters.acknowledged)
  }
  
  return filteredData
}

async function fetchStockAnalytics(storeId?: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  console.log('Fetching stock analytics with filters:', { storeId, period })
  
  try {
    // Construire les requêtes pour Appwrite
    const stockQueries = []
    const movementQueries = []
    const alertQueries = []
    
    if (storeId) {
      stockQueries.push(Query.equal('storeId', storeId))
      movementQueries.push(Query.equal('storeId', storeId))
      alertQueries.push(Query.equal('storeId', storeId))
    }
    
    // Ajouter une requête pour ne récupérer que les alertes non confirmées
    alertQueries.push(Query.equal('acknowledged', false))
    
    // Récupérer les niveaux de stock depuis Appwrite
    const stockResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES,
      stockQueries
    )
    
    // Récupérer les mouvements de stock depuis Appwrite
    const movementResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES_MOVEMENTS,
      movementQueries
    )
    
    // Récupérer les alertes de stock depuis Appwrite
    const alertsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.INVENTORIES_ALERTS,
      alertQueries
    )
    
    // Récupérer les produits pour obtenir les noms et SKUs
    const productsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      []
    )
    
    // Récupérer les catégories pour obtenir les noms
    const categoriesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CATEGORIES,
      []
    )
    
    // Récupérer les magasins pour obtenir les noms
    const storesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.STORES,
      []
    )
    
    const stockLevels = stockResponse.documents || []
    const stockMovements = movementResponse.documents || []
    const alertsDocuments = alertsResponse.documents || []
    const products = productsResponse.documents || []
    const categories = categoriesResponse.documents || []
    const stores = storesResponse.documents || []
    
    // Calculer les métriques de stock
    let totalValue = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let normalStockCount = 0
    let excessStockCount = 0
    
    // Map pour compter les mouvements par produit
    const productMovementCounts = new Map()
    
    // Map pour suivre la dernière date de mouvement par produit
    const lastMovementDates = new Map()
    
    // Traiter les niveaux de stock
    stockLevels.forEach(stock => {
      const product = products.find(p => p.$id === stock.productId)
      if (product) {
        // Calculer la valeur totale
        const stockValue = (stock.quantity || 0) * (product.unitCost || 0)
        totalValue += stockValue
        
        // Compter les stocks par statut
        if (stock.quantity <= 0) {
          outOfStockCount++
        } else if (stock.quantity < stock.minQuantity) {
          lowStockCount++
        } else if (stock.quantity > stock.maxQuantity) {
          excessStockCount++
        } else {
          normalStockCount++
        }
      }
    })
    
    // Traiter les mouvements de stock
    const today = new Date()
    stockMovements.forEach(movement => {
      const productId = movement.productId
      
      // Compter les mouvements par produit
      productMovementCounts.set(
        productId, 
        (productMovementCounts.get(productId) || 0) + movement.quantity
      )
      
      // Suivre la dernière date de mouvement
      const movementDate = new Date(movement.$createdAt)
      const currentLastDate = lastMovementDates.get(productId)
      
      if (!currentLastDate || movementDate > currentLastDate) {
        lastMovementDates.set(productId, movementDate)
      }
    })
    
    // Calculer les produits à rotation rapide (top moving)
    const topMovingProducts = Array.from(productMovementCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.$id === productId) || {}
        const productName = typeof product === 'object' && product !== null && 'name' in product ? product.name : 'Produit inconnu'
        
        return {
          product_id: productId,
          product_name: productName,
          total_quantity: quantity
        }
      })
    
    // Calculer les produits à rotation lente (slow moving)
    const slowMovingProducts = Array.from(lastMovementDates.entries())
      .map(([productId, lastDate]) => {
        const daysSinceMovement = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
        const product = products.find(p => p.$id === productId) || {}
        const stock = stockLevels.find(s => s.productId === productId) || {}
        
        const categoryId = typeof product === 'object' && product !== null && 'categoryId' in product ? product.categoryId : ''
        const category = categories.find(c => c.$id === categoryId) || {}
        
        const productName = typeof product === 'object' && product !== null && 'name' in product ? product.name : 'Produit inconnu'
        const categoryName = typeof category === 'object' && category !== null && 'name' in category ? category.name : 'Catégorie inconnue'
        const stockQuantity = typeof stock === 'object' && stock !== null && 'quantity' in stock ? Number(stock.quantity) : 0
        const unitCost = typeof product === 'object' && product !== null && 'unitCost' in product ? Number(product.unitCost) : 0
        
        return {
          product_id: productId,
          product_name: productName,
          category: categoryName,
          days_without_movement: daysSinceMovement,
          quantity: stockQuantity,
          value: stockQuantity * unitCost
        }
      })
      .filter(item => item.quantity > 0 && item.days_without_movement > 14) // Filtrer les produits avec stock > 0 et sans mouvement depuis plus de 14 jours
      .sort((a, b) => b.days_without_movement - a.days_without_movement)
      .slice(0, 3)
    
    // Pour l'évolution de la valeur du stock, nous utilisons des données simulées
    // Dans une implémentation réelle, ces données proviendraient d'un historique
    const stockValueTrend = [
      { date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: Math.round(totalValue * 0.9) },
      { date: new Date(today.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: Math.round(totalValue * 0.92) },
      { date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: Math.round(totalValue * 0.96) },
      { date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: Math.round(totalValue * 0.98) },
      { date: today.toISOString().split('T')[0], value: totalValue }
    ]
    
    // Calculer le taux de rotation du stock (approximation)
    const inventoryTurnover = stockLevels.length > 0 ? 
      parseFloat((stockMovements.length / stockLevels.length).toFixed(1)) : 0
    
    // Transformer les alertes brutes en StockAlert[]
    const alerts = alertsDocuments.map(alert => {
      // Trouver les informations du produit et du magasin
      const product = products.find(p => p.$id === alert.productId) || {}
      const store = stores.find(s => s.$id === alert.storeId) || {}
      
      // Extraire les propriétés avec vérification de type
      const productName: string = typeof product === 'object' && product !== null && 'name' in product ? String(product.name) : 'Produit inconnu'
      const productSku: string = typeof product === 'object' && product !== null && 'sku' in product ? String(product.sku) : ''
      const storeName: string = typeof store === 'object' && store !== null && 'name' in store ? String(store.name) : 'Magasin inconnu'
      
      return {
        id: alert.$id,
        type: alert.type,
        severity: alert.severity,
        productId: alert.productId,
        productName,
        productSku,
        storeId: alert.storeId,
        storeName,
        message: alert.message,
        quantity: alert.quantity,
        threshold: alert.threshold,
        createdAt: alert.$createdAt,
        acknowledged: alert.acknowledged || false,
        acknowledgedBy: alert.acknowledgedBy,
        acknowledgedAt: alert.acknowledgedAt
      }
    })
    
    return {
      total_value: totalValue,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      normal_stock_count: normalStockCount,
      excess_stock_count: excessStockCount,
      inventory_turnover: inventoryTurnover,
      top_moving_products: topMovingProducts,
      slow_moving_products: slowMovingProducts,
      stock_value_trend: stockValueTrend,
      alerts: alerts
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des analyses de stock:', error)
    return {
      total_value: 0,
      low_stock_count: 0,
      out_of_stock_count: 0,
      normal_stock_count: 0,
      excess_stock_count: 0,
      inventory_turnover: 0,
      top_moving_products: [],
      slow_moving_products: [],
      stock_value_trend: [],
      alerts: []
    }
  }
}

async function createStockMovement(data: {
  productId: string
  movementType: 'entry' | 'exit' | 'transfer' | 'adjustment'
  quantity: number
  sourceStoreId: string | null
  destinationStoreId: string | null
  reason: string
  notes: string
}) {
  // Simulation - À remplacer par un appel API réel
  console.log('Creating stock movement:', data)
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Simuler une réponse de succès
  return {
    id: `mov-${Date.now()}`,
    ...data,
    createdBy: 'Current User',
    createdAt: new Date().toISOString(),
  }
}

async function createInventory(data: {
  name: string
  storeId: string
  inventoryType: 'full' | 'partial' | 'cycle'
  scheduledDate: Date
  categories: string[]
  notes: string
  blockSales: boolean
  blockMovements: boolean
}) {
  // Simulation - À remplacer par un appel API réel
  console.log('Creating inventory:', data)
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 800))
  
  // Simuler une réponse de succès
  return {
    id: `inv-${Date.now()}`,
    ...data,
    status: 'scheduled',
    startDate: null,
    endDate: null,
    totalItems: 0,
    countedItems: 0,
    discrepancies: 0,
    createdBy: 'Current User',
    createdAt: new Date().toISOString(),
  }
}

async function acknowledgeAlert(alertId: string) {
  // Simulation - À remplacer par un appel API réel
  console.log('Acknowledging alert:', alertId)
  
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Simuler une réponse de succès
  return {
    success: true,
    alertId,
    acknowledgedBy: 'Current User',
    acknowledgedAt: new Date().toISOString(),
  }
}

// Hooks
export function useStockLevels(storeId?: string, categoryId?: string, status?: string, search?: string) {
  return useQuery<StockLevel[]>({
    queryKey: ['stockLevels', storeId, categoryId, status, search],
    queryFn: () => {
      console.warn('Stock levels temporairement désactivé - collections manquantes')
      return Promise.resolve([] as StockLevel[])
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useStockMovements(filters: {
  storeId?: string
  productId?: string
  movementType?: string
  startDate?: string
  endDate?: string
  search?: string
}) {
  return useQuery<StockMovement[]>({
    queryKey: ['stockMovements', filters],
    queryFn: () => {
      console.warn('Stock movements temporairement désactivé - collections manquantes')
      return Promise.resolve([] as StockMovement[])
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useInventories(filters: {
  storeId?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  return useQuery<Inventory[]>({
    queryKey: ['inventories', filters],
    queryFn: () => {
      console.warn('Inventories temporairement désactivé - collections manquantes')
      return Promise.resolve([] as Inventory[])
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useStockAlerts(filters: {
  storeId?: string
  severity?: string
  type?: string
  acknowledged?: boolean
}) {
  return useQuery<StockAlert[]>({
    queryKey: ['stockAlerts', filters],
    queryFn: async () => {
      try {
        // Récupérer tous les produits pour analyser leur stock
        const queries = []
        if (filters.storeId) {
          queries.push(Query.equal('storeId', filters.storeId))
        }
        
        const productsResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PRODUCTS,
          queries
        )
        
        const products = productsResponse.documents
        const alerts: StockAlert[] = []
        
        // Analyser chaque produit pour détecter les alertes
        products.forEach((product: any) => {
          const stockQuantity = product.stockQuantity || 0
          const lowStockThreshold = product.lowStockThreshold || 5
          
          // Alerte de rupture de stock
          if (stockQuantity === 0) {
            alerts.push({
              id: `out_of_stock_${product.$id}`,
              type: 'out_of_stock',
              severity: 'critical',
              productId: product.$id,
              productName: product.name || 'Produit inconnu',
              productSku: product.sku || '',
              storeId: product.storeId || '',
              storeName: 'Magasin principal',
              message: `Rupture de stock pour ${product.name}`,
              quantity: stockQuantity,
              threshold: lowStockThreshold,
              createdAt: new Date().toISOString(),
              acknowledged: false
            })
          }
          // Alerte de stock faible
          else if (stockQuantity > 0 && stockQuantity <= lowStockThreshold) {
            alerts.push({
              id: `low_stock_${product.$id}`,
              type: 'low_stock',
              severity: 'warning',
              productId: product.$id,
              productName: product.name || 'Produit inconnu',
              productSku: product.sku || '',
              storeId: product.storeId || '',
              storeName: 'Magasin principal',
              message: `Stock faible pour ${product.name} (${stockQuantity} restant)`,
              quantity: stockQuantity,
              threshold: lowStockThreshold,
              createdAt: new Date().toISOString(),
              acknowledged: false
            })
          }
        })
        
        // Filtrer selon les critères
        let filteredAlerts = alerts
        
        if (filters.severity) {
          filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity)
        }
        
        if (filters.type) {
          filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type)
        }
        
        if (filters.acknowledged !== undefined) {
          filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filters.acknowledged)
        }
        
        return filteredAlerts
      } catch (error) {
        console.error('Erreur lors de la récupération des alertes de stock:', error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useStockAnalytics(storeId?: string, period: 'week' | 'month' | 'quarter' | 'year' = 'month') {
  return useQuery<StockAnalytics>({
    queryKey: ['stockAnalytics', storeId, period],
    queryFn: () => {
      // Temporairement désactivé car les collections d'inventaire n'existent pas encore
      console.warn('Stock analytics temporairement désactivé - collections manquantes')
      return Promise.resolve({
        total_value: 0,
        low_stock_count: 0,
        out_of_stock_count: 0,
        normal_stock_count: 0,
        excess_stock_count: 0,
        inventory_turnover: 0,
        top_moving_products: [],
        slow_moving_products: [],
        stock_value_trend: [],
        alerts: []
      } as StockAnalytics)
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient()
  
  type StockMovementInput = {
    productId: string
    movementType: 'entry' | 'exit' | 'transfer' | 'adjustment'
    quantity: number
    sourceStoreId: string | null
    destinationStoreId: string | null
    reason: string
    notes: string
  }
  
  type StockMovementResult = {
    id: string
    createdBy: string
    createdAt: string
  } & StockMovementInput
  
  return useMutation<StockMovementResult, Error, StockMovementInput>({
    mutationFn: (data: StockMovementInput) => createStockMovement(data),
    onSuccess: () => {
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['stockLevels'] })
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] })
      queryClient.invalidateQueries({ queryKey: ['stockAnalytics'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création du mouvement de stock.',
        variant: 'destructive',
      })
    }
  })
}

export function useCreateInventory() {
  const queryClient = useQueryClient()
  
  type InventoryInput = {
    name: string
    storeId: string
    inventoryType: 'full' | 'partial' | 'cycle'
    scheduledDate: Date
    categories: string[]
    notes: string
    blockSales: boolean
    blockMovements: boolean
  }
  
  type InventoryResult = {
    id: string
    status: string
    startDate: null
    endDate: null
    totalItems: number
    countedItems: number
    discrepancies: number
    createdBy: string
    createdAt: string
  } & InventoryInput
  
  return useMutation<InventoryResult, Error, InventoryInput>({
    mutationFn: (data: InventoryInput) => createInventory(data),
    onSuccess: () => {
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['inventories'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de l\'inventaire.',
        variant: 'destructive',
      })
    }
  })
}

export function useAcknowledgeAlert() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (alertId: string) => acknowledgeAlert(alertId),
    onSuccess: () => {
      // Invalider les requêtes pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la confirmation de l\'alerte.',
        variant: 'destructive',
      })
    }
  })
}

