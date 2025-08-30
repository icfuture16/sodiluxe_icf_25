import { render } from '@testing-library/react'
import DashboardSkeleton from '../DashboardSkeleton'

describe('DashboardSkeleton', () => {
  it('renders the skeleton structure correctly', () => {
    render(<DashboardSkeleton />)
    
    // Vérifier que la structure principale est présente
    const skeletonContainer = document.querySelector('.dashboard-fade-in')
    expect(skeletonContainer).toBeInTheDocument()
    
    // Vérifier que l'en-tête est présent
    const header = document.querySelector('.dashboard-header')
    expect(header).toBeInTheDocument()
    
    // Vérifier que les KPIs sont présents (6 éléments)
    const kpiSkeletons = document.querySelectorAll('.dashboard-grid > .dashboard-card')
    expect(kpiSkeletons.length).toBe(6)
    
    // Vérifier que les graphiques principaux sont présents (2 éléments)
    const mainChartSkeletons = document.querySelectorAll('.dashboard-grid-primary > .dashboard-card')
    expect(mainChartSkeletons.length).toBe(2)
    
    // Vérifier que les graphiques secondaires sont présents (3 éléments)
    const secondaryChartSkeletons = document.querySelectorAll('.dashboard-secondary-grid > .dashboard-card')
    expect(secondaryChartSkeletons.length).toBe(3)
    
    // Vérifier que les éléments de squelette sont présents
    const skeletonElements = document.querySelectorAll('.dashboard-skeleton')
    expect(skeletonElements.length).toBeGreaterThan(10) // Il devrait y avoir plusieurs éléments de squelette
  })
})