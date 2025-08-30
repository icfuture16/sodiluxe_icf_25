import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils/formatters'
import { Badge } from '@/components/ui/badge'

interface StockAlert {
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

interface StockAlertsProps {
  alerts: StockAlert[]
  title?: string
  isLoading?: boolean
}

/**
 * Composant pour afficher les alertes de stock (rupture, stock faible, expiration)
 * 
 * @param alerts - Liste des alertes à afficher
 * @param title - Titre du composant (optionnel)
 * @param isLoading - Indique si les données sont en cours de chargement
 */
export function StockAlerts({ alerts, title = "Alertes de Stock", isLoading = false }: StockAlertsProps) {
  // Fonction pour obtenir le texte et la couleur de la badge en fonction du type et de la sévérité
  const getStatusBadge = (alert: StockAlert) => {
    // Déterminer le texte en fonction du type
    let text = 'Alerte';
    switch (alert.type) {
      case 'low_stock':
        text = 'Stock Faible';
        break;
      case 'out_of_stock':
        text = 'Rupture';
        break;
      case 'excess_stock':
        text = 'Surstock';
        break;
      case 'expiration':
        text = 'Expiration';
        break;
      case 'discrepancy':
        text = 'Écart';
        break;
    }
    
    // Déterminer la variante en fonction de la sévérité
    let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'secondary';
    switch (alert.severity) {
      case 'critical':
        variant = 'destructive';
        break;
      case 'warning':
        variant = 'default'; // Orange
        break;
      case 'info':
        variant = 'outline';
        break;
    }
    
    return { text, variant }
  }

  // Créer un tableau de placeholders pour l'état de chargement
  const loadingPlaceholders = Array(3).fill(0).map((_, index) => (
    <div key={`loading-${index}`} className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-24"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-16 mt-1"></div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-5 bg-gray-100 rounded animate-pulse w-20"></div>
        <div className="h-3 bg-gray-100 rounded animate-pulse w-24 mt-1"></div>
      </div>
    </div>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            loadingPlaceholders
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte de stock</p>
          ) : (
            alerts.slice(0, 5).map((alert) => {
              const badge = getStatusBadge(alert)
              
              return (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground">{alert.storeName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={badge.variant}>{badge.text}</Badge>
                    <div className="text-xs text-muted-foreground">
                      {alert.quantity !== undefined && alert.threshold !== undefined ? (
                        <>
                          Stock: {alert.quantity} / {alert.threshold}
                        </>
                      ) : (
                        <>{alert.message}</>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}