import { render, waitFor } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardStats from '../DashboardStats'

// Mock des composants enfants pour isoler les tests
jest.mock('@/components/stats/QuickStat', () => {
  return function MockQuickStat({ label, value }: { label: string; value: any }) {
    return <div data-testid={`quickstat-${label}`}>{value}</div>
  }
})

jest.mock('@/components/stats/RevenueChart', () => {
  return function MockRevenueChart() {
    return <div data-testid="revenue-chart">Revenue Chart</div>
  }
})

jest.mock('@/components/stats/StorePerformanceChart', () => {
  return function MockStorePerformanceChart() {
    return <div data-testid="store-performance-chart">Store Performance Chart</div>
  }
})

jest.mock('@/components/stats/CustomerSegmentChart', () => {
  return function MockCustomerSegmentChart() {
    return <div data-testid="customer-segment-chart">Customer Segment Chart</div>
  }
})

jest.mock('@/components/stats/TopProductsChart', () => {
  return function MockTopProductsChart() {
    return <div data-testid="top-products-chart">Top Products Chart</div>
  }
})

jest.mock('@/components/stats/DashboardAlerts', () => {
  return function MockDashboardAlerts() {
    return <div data-testid="dashboard-alerts">Dashboard Alerts</div>
  }
})

jest.mock('@/components/filters/DateRangeFilter', () => {
  return function MockDateRangeFilter({ onPeriodChange }: { onPeriodChange: (period: any) => void }) {
    return (
      <select 
        data-testid="date-range-filter"
        onChange={(e) => onPeriodChange(e.target.value)}
      >
        <option value="7d">7 derniers jours</option>
        <option value="30d">30 derniers jours</option>
        <option value="90d">90 derniers jours</option>
      </select>
    )
  }
})

jest.mock('@/components/dashboard/ExportDialog', () => {
  return function MockExportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    return open ? (
      <div data-testid="export-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  }
})

// Mock du hook useDashboardData
jest.mock('@/hooks/useDashboardData', () => ({
  useDashboardData: () => ({
    data: {
      sales: {
        id: 'sales',
        name: 'Sales',
        value: 100,
        unit: 'orders',
        trend: 5,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      revenue: {
        id: 'revenue',
        name: 'Revenue',
        value: 1000000,
        unit: 'FCFA',
        trend: 10,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      averageBasket: {
        id: 'averageBasket',
        name: 'Average Basket',
        value: 10000,
        unit: 'FCFA',
        trend: -2,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      customers: {
        id: 'customers',
        name: 'Customers',
        value: 50,
        unit: 'customers',
        trend: 3,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      newCustomers: {
        id: 'newCustomers',
        name: 'New Customers',
        value: 10,
        unit: 'customers',
        trend: 15,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      products: {
        id: 'products',
        name: 'Products',
        value: 200,
        unit: 'products',
        trend: 0,
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      serviceRequests: {
        id: 'service-requests',
        name: 'Service Requests',
        value: 5,
        unit: 'count',
        period: '7d',
        updatedAt: new Date().toISOString(),
        total: 5,
        resolved: 2,
        cancelled: 1,
        pending: 2,
        breakdown: {
          byStatus: [
            { name: 'Résolu', value: 2, color: 'bg-green-500' },
            { name: 'En cours', value: 2, color: 'bg-yellow-500' },
            { name: 'Annulée', value: 1, color: 'bg-red-500' }
          ]
        }
      },
      reservations: {
        id: 'reservations',
        name: 'Reservations',
        value: 3,
        unit: 'count',
        period: '7d',
        updatedAt: new Date().toISOString()
      },
      alerts: [{ id: '1', type: 'warning', message: 'Test alert', date: new Date().toISOString() }],
      recentSales: []
    },
    isLoading: false,
    error: null
  })
}))

// Créer un client de requête pour les tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// Wrapper pour le composant avec le contexte de requête
const renderWithQueryClient = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={testQueryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('DashboardStats', () => {
  it('renders the dashboard with all components', async () => {
    renderWithQueryClient(<DashboardStats />)
    
    // Vérifier que le titre est présent
    expect(screen.getByText('Statistiques & Analyses')).toBeInTheDocument()
    
    // Vérifier que les graphiques sont présents
    await waitFor(() => {
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument()
      expect(screen.getByTestId('store-performance-chart')).toBeInTheDocument()
      expect(screen.getByTestId('customer-segment-chart')).toBeInTheDocument()
      expect(screen.getByTestId('top-products-chart')).toBeInTheDocument()
      expect(screen.getByTestId('dashboard-alerts')).toBeInTheDocument()
    })
  })
  
  it('opens and closes the export dialog', async () => {
    renderWithQueryClient(<DashboardStats />)
    
    // Vérifier que la boîte de dialogue d'exportation n'est pas visible initialement
    expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
    
    // Cliquer sur le bouton d'exportation
    fireEvent.click(screen.getByText('Exporter'))
    
    // Vérifier que la boîte de dialogue d'exportation est visible
    await waitFor(() => {
      expect(screen.getByTestId('export-dialog')).toBeInTheDocument()
    })
    
    // Fermer la boîte de dialogue
    fireEvent.click(screen.getByText('Close'))
    
    // Vérifier que la boîte de dialogue d'exportation n'est plus visible
    await waitFor(() => {
      expect(screen.queryByTestId('export-dialog')).not.toBeInTheDocument()
    })
  })
  
  it('changes the period when date filter is changed', async () => {
    renderWithQueryClient(<DashboardStats />)
    
    // Changer la période à 30 jours
    fireEvent.change(screen.getByTestId('date-range-filter'), { target: { value: '30d' } })
    
    // Vérifier que la période a changé (cela pourrait nécessiter des mocks plus avancés pour être testé complètement)
    // Pour l'instant, nous vérifions simplement que l'application ne plante pas
    await waitFor(() => {
      expect(screen.getByTestId('date-range-filter')).toHaveValue('30d')
    })
  })
})