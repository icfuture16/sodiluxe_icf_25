'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { BsFilter, BsSearch } from 'react-icons/bs'
import UnifiedSalesTable from '@/components/sales/UnifiedSalesTable'
import SalesFilters from '../../../components/sales/SalesFilters'
import ReportDownloader from '@/components/sales/ReportDownloader'
import { OfflineFallback } from '@/components/feedback/OfflineFallback'
import { useAllSales } from '@/hooks/useAllSales'
import Link from 'next/link'
import PageProtection from '@/components/auth/PageProtection'
import { formatCurrency } from '@/lib/utils/formatters'

export default function HistoriqueClient() {
  // États pour les filtres
  const [storeFilter, setStoreFilter] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Définir le type DateRange pour aligner avec SalesFilters
  interface DateRange {
    startDate: Date | null
    endDate: Date | null
  }
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null })
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string | null>(null)
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' })
  
  // Récupérer les paramètres de l'URL
  const searchParams = useSearchParams()
  
  useEffect(() => {
    // Si un storeId est passé en paramètre, l'utiliser comme filtre
    const storeId = searchParams?.get('storeId')
    if (storeId) {
      setStoreFilter(storeId)
    }
  }, [searchParams])
  
  // Utiliser le hook useAllSales pour récupérer toutes les ventes (normales et à crédit) avec les filtres
  const { data: sales, isLoading, error } = useAllSales({
    store_id: storeFilter || undefined,
    start_date: dateRange.startDate ? dateRange.startDate.toISOString() : undefined,
    end_date: dateRange.endDate ? dateRange.endDate.toISOString() : undefined,
    // Les propriétés suivantes ne sont pas prises en charge par useAllSales,
    // mais nous les laissons commentées pour référence future
    // searchTerm,
    // status: statusFilter,
    // paymentMethod: paymentMethodFilter,
    // minAmount: amountFilter.min ? parseFloat(amountFilter.min) : undefined,
    // maxAmount: amountFilter.max ? parseFloat(amountFilter.max) : undefined,
  })
  
  // Fonction pour réinitialiser les filtres
  const resetFilters = () => {
    setStoreFilter(null)
    setSearchTerm('')
    setDateRange({ startDate: null, endDate: null })
    setStatusFilter(null)
    setPaymentMethodFilter(null)
    setAmountFilter({ min: '', max: '' })
  }
  

  
  // Calculer des statistiques sur les ventes
  const calculateStats = () => {
    if (!sales || sales.length === 0) return { count: 0, total: 0, average: 0 }
    
    const count = sales.length
    const total = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const average = total / count
    
    return { count, total, average }
  }
  
  const stats = calculateStats()
  
  return (
    <PageProtection>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Historique des ventes</h1>
          <ReportDownloader
            sales={sales || []}
            filters={{
              storeFilter,
              dateRange,
              statusFilter,
              paymentMethodFilter,
              amountFilter,
              searchTerm
            }}
          />
        </div>
        

        
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par client, vendeur ou numéro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-10 border rounded-md"
            />
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center my-12">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6">
                <div className="h-10 bg-slate-200 rounded"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
                <div className="h-20 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        ) : error ? (
          <OfflineFallback>
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p>Erreur lors du chargement des ventes. Veuillez réessayer.</p>
              <Link href="/ventes/historique" className="text-red-700 underline mt-2 inline-block">
                Réessayer
              </Link>
            </div>
          </OfflineFallback>
        ) : (
          <>
            {/* Filtrage local côté client */}
            {(() => {
              const filteredSales = (sales || []).filter(sale => {
                const search = searchTerm.trim().toLowerCase()
                if (!search) return true
                // Recherche sur le client, le vendeur, l'id, le montant
                return (
                  (sale.client?.fullName?.toLowerCase().includes(search)) ||
                  (sale.user?.fullName?.toLowerCase().includes(search)) ||
                  (sale.$id?.toLowerCase().includes(search)) ||
                  (String(sale.totalAmount).includes(search))
                )
              })
              return (
                <UnifiedSalesTable 
                  sales={filteredSales} 
                  showCreditColumns={true}
                  baseRoute="/ventes"
                  hideStoreColumn={true}
                  hideStatusColumn={true}
                />
              )
            })()}

            
            <div className="mt-6 bg-gray-50 p-4 rounded-md">
              <h2 className="text-lg font-semibold mb-2">Résumé</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500">Nombre de ventes</p>
                  <p className="text-2xl font-bold">{stats.count}</p>
                </div>
                <div className="bg-white p-3 rounded shadow-sm">
                  <p className="text-gray-500">Total des ventes</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total)} F CFA</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </PageProtection>
  )
}
