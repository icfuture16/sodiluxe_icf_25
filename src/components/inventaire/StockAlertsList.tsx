'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useStores } from '@/hooks/useStores'
import { useStockAlerts, StockAlert } from '@/hooks/useStock'

interface StockAlertsListProps {
  storeId?: string
}

export default function StockAlertsList({ storeId }: StockAlertsListProps) {
  const [severityFilter, setSeverityFilter] = useState<string | undefined>()
  const [typeFilter, setTypeFilter] = useState<string | undefined>()
  const [acknowledgedFilter, setAcknowledgedFilter] = useState<string>('unacknowledged')
  
  const { data: stores } = useStores()
  const { data: alerts, isLoading } = useStockAlerts({
    storeId,
    severity: severityFilter,
    type: typeFilter,
    acknowledged: acknowledgedFilter === 'all' ? undefined : acknowledgedFilter === 'acknowledged'
  })

  function getSeverityIcon(severity: string) {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      default:
        return <AlertCircle className="h-5 w-5" />
    }
  }

  function getAlertTypeLabel(type: string) {
    switch (type) {
      case 'low_stock':
        return 'Stock faible'
      case 'out_of_stock':
        return 'Rupture de stock'
      case 'excess_stock':
        return 'Surstock'
      case 'expiring':
        return 'Produit périssable'
      default:
        return type
    }
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Attention</Badge>
      case 'info':
        return <Badge variant="secondary">Information</Badge>
      default:
        return <Badge>{severity}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Select value={storeId} onValueChange={() => {
          // La fonction de changement sera implémentée dans une future mise à jour
          // quand la sélection de magasin sera fonctionnelle
        }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous les magasins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les magasins</SelectItem>
            {stores?.map(store => (
              <SelectItem key={store.$id} value={store.$id}>{store.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Toutes sévérités" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes sévérités</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="warning">Attention</SelectItem>
            <SelectItem value="info">Information</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tous types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous types</SelectItem>
            <SelectItem value="low_stock">Stock faible</SelectItem>
            <SelectItem value="out_of_stock">Rupture de stock</SelectItem>
            <SelectItem value="excess_stock">Surstock</SelectItem>
            <SelectItem value="expiring">Produit périssable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={acknowledgedFilter} onValueChange={setAcknowledgedFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unacknowledged">Non traitées</SelectItem>
            <SelectItem value="acknowledged">Traitées</SelectItem>
            <SelectItem value="all">Toutes</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={() => {
          setSeverityFilter(undefined)
          setTypeFilter(undefined)
          setAcknowledgedFilter('unacknowledged')
        }}>
          Réinitialiser
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">Chargement des alertes...</div>       
        ) : !Array.isArray(alerts) || alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune alerte trouvée
          </div>
        ) : (
          (alerts as StockAlert[]).map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getSeverityIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{getAlertTypeLabel(alert.type)}</h3>
                      {getSeverityBadge(alert.severity)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="mt-1">{alert.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Produit:</span> {alert.productName}
                      <span className="mx-2">|</span>
                      <span className="font-medium">Magasin:</span> {alert.storeName}
                    </div>
                    {!alert.acknowledged ? (
                      <Button size="sm" variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        Marquer comme traitée
                      </Button>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Traitée par {alert.acknowledgedBy} le {new Date(alert.acknowledgedAt || '').toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}