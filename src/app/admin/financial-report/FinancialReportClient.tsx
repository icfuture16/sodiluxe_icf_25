'use client'

import { useState, useEffect } from 'react'
import { useClients, useProducts, useSales, useStores } from '@/hooks'
import { useUsers } from '@/hooks/useUsers'
import PageProtection from '@/components/auth/PageProtection'
import type { Sale } from '@/types/appwrite.types'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import { ArrowUpIcon, ArrowDownIcon, CalendarIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

type TopSellerType = {
  sellerId: string
  sellerName: string
  storeId: string
  storeName: string
  totalSales: number
  totalAmount: number
}

type TopClientType = {
  clientId: string
  clientName: string
  purchaseCount: number
  totalSpent: number
}

type StorePerformanceType = {
  storeId: string
  storeName: string
  salesCount: number
  totalRevenue: number
  averageTicket: number
}

export default function FinancialReportClient() {
  const { data: sales, isLoading: isLoadingSales, error: salesError } = useSales()
  const { data: clients, error: clientsError } = useClients()
  const { data: users, error: usersError } = useUsers()
  const { data: stores, error: storesError } = useStores()
  const { data: products, error: productsError } = useProducts()

  // Vérifier si des erreurs sont présentes dans les collections
  const [missingCollections, setMissingCollections] = useState<string[]>([])

  useEffect(() => {
    const errors = [
      { name: 'ventes', error: salesError },
      { name: 'clients', error: clientsError },
      { name: 'utilisateurs', error: usersError },
      { name: 'magasins', error: storesError },
      { name: 'produits', error: productsError }
    ]

    const missing = errors
      .filter(item => item.error && (item.error as any)?.message?.includes('collection_not_found'))
      .map(item => item.name)

    setMissingCollections(missing)
  }, [salesError, clientsError, usersError, storesError, productsError])

  const [totalRevenue, setTotalRevenue] = useState(0)
  const [revenuePerMonth, setRevenuePerMonth] = useState<{[key: string]: number}>({})
  const [topSellers, setTopSellers] = useState<TopSellerType[]>([])
  const [worstSellers, setWorstSellers] = useState<TopSellerType[]>([])
  const [topClients, setTopClients] = useState<TopClientType[]>([])
  const [storePerformance, setStorePerformance] = useState<StorePerformanceType[]>([])
  // État pour le sélecteur de période
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    end: new Date()
  })
  
  // État pour le mois courant sélectionné (pour filtres prédéfinis)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Fonction pour définir la période sur le mois actuel
  const setCurrentMonthRange = () => {
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    setDateRange({ start, end })
    setCurrentMonth(new Date())
  }
  
  // Fonction pour définir la période sur le mois précédent
  const setPreviousMonthRange = () => {
    const previousMonth = subMonths(currentMonth, 1)
    const start = startOfMonth(previousMonth)
    const end = endOfMonth(previousMonth)
    setDateRange({ start, end })
    setCurrentMonth(previousMonth)
  }
  
  // Fonction pour définir la période sur le mois suivant
  const setNextMonthRange = () => {
    const nextMonth = addMonths(currentMonth, 1)
    const start = startOfMonth(nextMonth)
    const end = endOfMonth(nextMonth)
    setDateRange({ start, end })
    setCurrentMonth(nextMonth)
  }
  
  // Définir le format de date avec la locale française
  const formatDateFr = (date: Date) => {
    return format(date, 'dd MMM yyyy', { locale: fr })
  }

  useEffect(() => {
    if (sales && clients && users && stores) {
      calculateFinancialMetrics()
    }
  }, [sales, clients, users, stores, dateRange])

  const calculateFinancialMetrics = () => {
    if (!sales || !clients || !users || !stores) return

    // Filtrer les ventes dans la plage de dates
    const filteredSales = sales.filter((sale: Sale) => {
      const saleDate = new Date(sale.saleDate)
      return saleDate >= dateRange.start && saleDate <= dateRange.end
    })

    // Calculer le chiffre d'affaires total
    const total = filteredSales.reduce((acc, sale) => acc + sale.totalAmount, 0)
    setTotalRevenue(total)

    // Calculer le chiffre d'affaires par mois
    const monthlyRevenue: {[key: string]: number} = {}
    filteredSales.forEach((sale: Sale) => {
      const date = new Date(sale.saleDate)
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`
      monthlyRevenue[monthYear] = (monthlyRevenue[monthYear] || 0) + sale.totalAmount
    })
    setRevenuePerMonth(monthlyRevenue)

    // Calculer les performances des vendeurs
    const sellerStats: {[key: string]: TopSellerType} = {}
    filteredSales.forEach((sale: Sale) => {
      const sellerId = sale.userId // userId est l'ID du vendeur dans le contexte
      if (!sellerStats[sellerId]) {
        const seller = users.find((s: any) => s.$id === sellerId)
        const store = stores.find((s: any) => s.$id === seller?.storeId)
        sellerStats[sellerId] = {
          sellerId,
          sellerName: seller?.fullName || 'Inconnu',
          storeId: seller?.storeId || '',
          storeName: store?.name || 'Inconnu',
          totalSales: 0,
          totalAmount: 0
        }
      }
      sellerStats[sellerId].totalSales += 1
      sellerStats[sellerId].totalAmount += sale.totalAmount
    })
    
    const sellersArray = Object.values(sellerStats)
    sellersArray.sort((a, b) => b.totalAmount - a.totalAmount)
    
    setTopSellers(sellersArray.slice(0, 3))
    setWorstSellers([...sellersArray].sort((a, b) => a.totalAmount - b.totalAmount).slice(0, 3))

    // Calculer les clients les plus actifs
    const clientStats: {[key: string]: TopClientType} = {}
    filteredSales.forEach((sale: Sale) => {
      const clientId = sale.clientId
      if (!clientStats[clientId]) {
        const client = clients.find((c: any) => c.$id === clientId)
        clientStats[clientId] = {
          clientId,
          clientName: client?.fullName || 'Inconnu',
          purchaseCount: 0,
          totalSpent: 0
        }
      }
      clientStats[clientId].purchaseCount += 1
      clientStats[clientId].totalSpent += sale.totalAmount
    })
    
    const clientsArray = Object.values(clientStats)
    clientsArray.sort((a, b) => b.totalSpent - a.totalSpent)
    
    setTopClients(clientsArray.slice(0, 5))

    // Calculer les performances des boutiques
    const storeStats: {[key: string]: StorePerformanceType} = {}
    filteredSales.forEach((sale: Sale) => {
      const seller = users.find((s: any) => s.$id === sale.userId)
      if (!seller) return
      
      const storeId = seller.storeId
      if (!storeStats[storeId]) {
        const store = stores.find(s => s.$id === storeId)
        storeStats[storeId] = {
          storeId,
          storeName: store?.name || 'Inconnu',
          salesCount: 0,
          totalRevenue: 0,
          averageTicket: 0
        }
      }
      storeStats[storeId].salesCount += 1
      storeStats[storeId].totalRevenue += sale.totalAmount
    })
    
    // Calculer le ticket moyen par boutique
    Object.keys(storeStats).forEach(storeId => {
      const store = storeStats[storeId]
      store.averageTicket = store.totalRevenue / (store.salesCount || 1)
    })
    
    const storesArray = Object.values(storeStats)
    storesArray.sort((a, b) => b.totalRevenue - a.totalRevenue)
    
    setStorePerformance(storesArray)
  }

  if (isLoadingSales) {
    return <div className="flex justify-center items-center h-64">Chargement des données financières...</div>
  }
  
  // Afficher un message si des collections sont manquantes
  if (missingCollections.length > 0) {
    return (
      <PageProtection>
        <div className="p-8">
          <Card className="bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-amber-700">Certaines collections sont manquantes</CardTitle>
              <CardDescription className="text-amber-600">
                Le bilan financier ne peut pas être généré complètement car certaines collections Appwrite sont manquantes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-amber-600 mb-4">
                Les collections suivantes n'ont pas été trouvées dans la base de données :
              </p>
              <ul className="list-disc pl-5 space-y-1 text-amber-800">
                {missingCollections.map(collection => (
                  <li key={collection}>{collection}</li>
                ))}
              </ul>
              <p className="mt-4 text-amber-700">
                Solution : Veuillez créer ces collections dans votre base de données Appwrite avant d'utiliser cette fonctionnalité.
              </p>
            </CardContent>
          </Card>
        </div>
      </PageProtection>
    )
  }

  return (
    <PageProtection>
      <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bilan Financier</h1>
          <p className="text-muted-foreground mt-2">
            Aperçu des performances financières et commerciales
          </p>
        </div>
        
        {/* Sélecteur de période */}
        <div className="flex items-center space-x-2">
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium">Période d'analyse:</div>
            <div className="text-sm text-muted-foreground">
              {formatDateFr(dateRange.start)} - {formatDateFr(dateRange.end)}
            </div>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-10 h-10 p-0">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="grid gap-4">
                <div className="flex flex-col space-y-2">
                  <h4 className="font-medium leading-none">Choisir une période</h4>
                  <div className="flex flex-col space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={setCurrentMonthRange}>Mois actuel</Button>
                      <Button variant="outline" onClick={setPreviousMonthRange}>Mois précédent</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setDateRange({
                          start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
                          end: new Date()
                        })}
                      >
                        30 jours
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setDateRange({
                          start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
                          end: new Date()
                        })}
                      >
                        90 jours
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setDateRange({
                          start: new Date(new Date().setMonth(new Date().getMonth() - 12)),
                          end: new Date()
                        })}
                      >
                        1 an
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Cartes de synthèse */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Chiffre d'affaires */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20 rounded-full bg-blue-400" />
          <CardHeader>
            <CardTitle className="text-blue-800">Chiffre d'affaires</CardTitle>
            <CardDescription className="text-blue-600">
              Pour la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        
        {/* Nombre de ventes */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20 rounded-full bg-green-400" />
          <CardHeader>
            <CardTitle className="text-green-800">Nombre de ventes</CardTitle>
            <CardDescription className="text-green-600">
              Pour la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900">
              {sales?.filter((sale: Sale) => {
                const saleDate = new Date(sale.saleDate);
                return saleDate >= dateRange.start && saleDate <= dateRange.end;
              }).length || 0}
            </div>
          </CardContent>
        </Card>
        
        {/* Panier moyen */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 opacity-20 rounded-full bg-purple-400" />
          <CardHeader>
            <CardTitle className="text-purple-800">Panier moyen</CardTitle>
            <CardDescription className="text-purple-600">
              Pour la période sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-900">
              {formatCurrency(totalRevenue / (
                sales?.filter((sale: Sale) => {
                  const saleDate = new Date(sale.saleDate);
                  return saleDate >= dateRange.start && saleDate <= dateRange.end;
                }).length || 1
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Graphiques */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Graphique d'évolution des ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des ventes</CardTitle>
            <CardDescription>Chiffre d'affaires par période</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {sales && sales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(revenuePerMonth).map(([month, amount]) => ({
                    month,
                    amount
                  }))}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Chiffre d\'affaires']}
                    labelFormatter={(label) => `Période: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" name="Chiffre d'affaires" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Pas assez de données pour afficher le graphique
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Répartition par boutique */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par boutique</CardTitle>
            <CardDescription>Part de chaque boutique dans le chiffre d'affaires</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {storePerformance && storePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={storePerformance.map((store, index) => ({
                      name: store.storeName,
                      value: store.totalRevenue
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {storePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Pas assez de données pour afficher le graphique
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Vendeurs les plus performants */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top 3 Vendeurs</CardTitle>
            <CardDescription>Par montant des ventes</CardDescription>
          </CardHeader>
          <CardContent>
            {topSellers.length > 0 ? (
              <div className="space-y-4">
                {topSellers.map((seller, index) => (
                  <div key={seller.sellerId} className="flex items-start justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <div className="font-medium">{index + 1}. {seller.sellerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {seller.storeName} • {seller.totalSales} ventes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(seller.totalAmount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>

        {/* Vendeurs les moins performants */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Vendeurs à améliorer</CardTitle>
            <CardDescription>Par montant des ventes</CardDescription>
          </CardHeader>
          <CardContent>
            {worstSellers.length > 0 ? (
              <div className="space-y-4">
                {worstSellers.map((seller, index) => (
                  <div key={seller.sellerId} className="flex items-start justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <div className="font-medium">{seller.sellerName}</div>
                      <div className="text-sm text-muted-foreground">
                        {seller.storeName} • {seller.totalSales} ventes
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(seller.totalAmount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>

        {/* Clients les plus actifs */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>Par montant dépensé</CardDescription>
          </CardHeader>
          <CardContent>
            {topClients.length > 0 ? (
              <div className="space-y-4">
                {topClients.map((client) => (
                  <div key={client.clientId} className="flex items-start justify-between border-b pb-2 last:border-b-0">
                    <div>
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-sm text-muted-foreground">{client.purchaseCount} achats</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(client.totalSpent)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-muted-foreground">Aucune donnée disponible</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance des boutiques */}
      <Card>
        <CardHeader>
          <CardTitle>Performance des boutiques</CardTitle>
          <CardDescription>Comparaison des ventes par boutique</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Boutique</th>
                  <th scope="col" className="px-6 py-3">Nombre de ventes</th>
                  <th scope="col" className="px-6 py-3">Chiffre d'affaires</th>
                  <th scope="col" className="px-6 py-3">Ticket moyen</th>
                </tr>
              </thead>
              <tbody>
                {storePerformance.map((store) => (
                  <tr key={store.storeId} className="bg-white border-b">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {store.storeName}
                    </td>
                    <td className="px-6 py-4">{store.salesCount}</td>
                    <td className="px-6 py-4">{formatCurrency(store.totalRevenue)}</td>
                    <td className="px-6 py-4">{formatCurrency(store.averageTicket)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </PageProtection>
  )
}
