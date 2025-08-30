import { render, act } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import DashboardLayout from '../DashboardLayout'

// Mock de la fonction window.innerWidth
const originalInnerWidth = window.innerWidth

// Mock de ResizeObserver qui n'est pas disponible dans l'environnement de test
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

describe('DashboardLayout', () => {
  afterEach(() => {
    // Restaurer la valeur originale après chaque test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
    jest.clearAllMocks()
  })

  it('renders children correctly', () => {
    render(
      <DashboardLayout>
        <div data-testid="test-child">Test Content</div>
      </DashboardLayout>
    )

    expect(screen.getByTestId('test-child')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies mobile class when screen width is less than 640px', () => {
    // Simuler une largeur d'écran mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    // Déclencher l'événement de redimensionnement
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Vérifier que la classe mobile est appliquée
    const container = screen.getByTestId('dashboard-layout')
    expect(container).toHaveClass('dashboard-mobile')
    expect(container).not.toHaveClass('dashboard-tablet')
    expect(container).not.toHaveClass('dashboard-desktop')
    expect(container).not.toHaveClass('dashboard-wide')
  })

  it('applies tablet class when screen width is between 640px and 1023px', () => {
    // Simuler une largeur d'écran tablette
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 800,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    // Déclencher l'événement de redimensionnement
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Vérifier que la classe tablette est appliquée
    const container = screen.getByTestId('dashboard-layout')
    expect(container).not.toHaveClass('dashboard-mobile')
    expect(container).toHaveClass('dashboard-tablet')
    expect(container).not.toHaveClass('dashboard-desktop')
    expect(container).not.toHaveClass('dashboard-wide')
  })

  it('applies desktop class when screen width is between 1024px and 1279px', () => {
    // Simuler une largeur d'écran desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1100,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    // Déclencher l'événement de redimensionnement
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Vérifier que la classe desktop est appliquée
    const container = screen.getByTestId('dashboard-layout')
    expect(container).not.toHaveClass('dashboard-mobile')
    expect(container).not.toHaveClass('dashboard-tablet')
    expect(container).toHaveClass('dashboard-desktop')
    expect(container).not.toHaveClass('dashboard-wide')
  })

  it('applies wide class when screen width is 1280px or more', () => {
    // Simuler une largeur d'écran large
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1400,
    })

    render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    // Déclencher l'événement de redimensionnement
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Vérifier que la classe wide est appliquée
    const container = screen.getByTestId('dashboard-layout')
    expect(container).not.toHaveClass('dashboard-mobile')
    expect(container).not.toHaveClass('dashboard-tablet')
    expect(container).not.toHaveClass('dashboard-desktop')
    expect(container).toHaveClass('dashboard-wide')
  })

  it('removes event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = render(
      <DashboardLayout>
        <div>Test Content</div>
      </DashboardLayout>
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
  })
})