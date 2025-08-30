import { render, waitFor } from '@testing-library/react'
import { screen, fireEvent } from '@testing-library/dom'
import ExportDialog from '../ExportDialog'

describe('ExportDialog', () => {
  const mockOnClose = jest.fn()
  const mockDashboardData = {
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
  }

  beforeEach(() => {
    mockOnClose.mockClear()
    // Mock des fonctions de téléchargement
    global.URL.createObjectURL = jest.fn(() => 'mock-url')
    global.URL.revokeObjectURL = jest.fn()
  })

  it('renders correctly when open is true', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    expect(screen.getByText('Exporter les données')).toBeInTheDocument()
    expect(screen.getByText('Format')).toBeInTheDocument()
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(screen.getByText('Orientation')).toBeInTheDocument()
    expect(screen.getByText('Portrait')).toBeInTheDocument()
    expect(screen.getByText('Paysage')).toBeInTheDocument()
    expect(screen.getByText('Inclure les données brutes')).toBeInTheDocument()
    expect(screen.getByText('Annuler')).toBeInTheDocument()
    expect(screen.getByText('Exporter')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(
      <ExportDialog 
        open={false} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    expect(screen.queryByText('Exporter les données')).not.toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    fireEvent.click(screen.getByText('Annuler'))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('changes format when PDF or CSV is selected', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    // Vérifier que PDF est sélectionné par défaut
    expect(screen.getByText('PDF')).toHaveClass('bg-primary')
    expect(screen.getByText('CSV')).not.toHaveClass('bg-primary')

    // Sélectionner CSV
    fireEvent.click(screen.getByText('CSV'))

    // Vérifier que CSV est maintenant sélectionné
    expect(screen.getByText('PDF')).not.toHaveClass('bg-primary')
    expect(screen.getByText('CSV')).toHaveClass('bg-primary')

    // Sélectionner PDF à nouveau
    fireEvent.click(screen.getByText('PDF'))

    // Vérifier que PDF est à nouveau sélectionné
    expect(screen.getByText('PDF')).toHaveClass('bg-primary')
    expect(screen.getByText('CSV')).not.toHaveClass('bg-primary')
  })

  it('changes orientation when Portrait or Landscape is selected', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    // Vérifier que Portrait est sélectionné par défaut
    expect(screen.getByText('Portrait')).toHaveClass('bg-primary')
    expect(screen.getByText('Paysage')).not.toHaveClass('bg-primary')

    // Sélectionner Paysage
    fireEvent.click(screen.getByText('Paysage'))

    // Vérifier que Paysage est maintenant sélectionné
    expect(screen.getByText('Portrait')).not.toHaveClass('bg-primary')
    expect(screen.getByText('Paysage')).toHaveClass('bg-primary')

    // Sélectionner Portrait à nouveau
    fireEvent.click(screen.getByText('Portrait'))

    // Vérifier que Portrait est à nouveau sélectionné
    expect(screen.getByText('Portrait')).toHaveClass('bg-primary')
    expect(screen.getByText('Paysage')).not.toHaveClass('bg-primary')
  })

  it('toggles include raw data when checkbox is clicked', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    const checkbox = screen.getByRole('checkbox')
    
    // Vérifier que la case n'est pas cochée par défaut
    expect(checkbox).not.toBeChecked()

    // Cocher la case
    fireEvent.click(checkbox)

    // Vérifier que la case est maintenant cochée
    expect(checkbox).toBeChecked()

    // Décocher la case
    fireEvent.click(checkbox)

    // Vérifier que la case n'est plus cochée
    expect(checkbox).not.toBeChecked()
  })

  it('shows loading state when export button is clicked', async () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    // Cliquer sur le bouton d'exportation
    fireEvent.click(screen.getByText('Exporter'))

    // Vérifier que l'état de chargement est affiché
    expect(screen.getByText('Exportation en cours...')).toBeInTheDocument()

    // Attendre que l'exportation soit terminée
    await waitFor(() => {
      expect(screen.queryByText('Exportation en cours...')).not.toBeInTheDocument()
    }, { timeout: 3000 })

    // Vérifier que le dialogue est fermé après l'exportation
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('disables orientation options when CSV format is selected', () => {
    render(
      <ExportDialog 
        open={true} 
        onClose={mockOnClose} 
        dashboardData={{
          ...mockDashboardData,
          alerts: [{
            id: '1',
            type: 'warning' as const,
            message: 'Test alert',
            date: new Date().toISOString()
          }]
        }}
        period="7d"
      />
    )

    // Vérifier que les options d'orientation sont activées par défaut (format PDF)
    expect(screen.getByText('Portrait').closest('button')).not.toBeDisabled()
    expect(screen.getByText('Paysage').closest('button')).not.toBeDisabled()

    // Sélectionner le format CSV
    fireEvent.click(screen.getByText('CSV'))

    // Vérifier que les options d'orientation sont désactivées
    expect(screen.getByText('Portrait').closest('button')).toBeDisabled()
    expect(screen.getByText('Paysage').closest('button')).toBeDisabled()

    // Sélectionner le format PDF à nouveau
    fireEvent.click(screen.getByText('PDF'))

    // Vérifier que les options d'orientation sont à nouveau activées
    expect(screen.getByText('Portrait').closest('button')).not.toBeDisabled()
    expect(screen.getByText('Paysage').closest('button')).not.toBeDisabled()
  })
})