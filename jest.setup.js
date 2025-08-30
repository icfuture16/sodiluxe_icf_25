import '@testing-library/jest-dom'
import 'jest-canvas-mock'

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    nav: 'nav',
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = jest.fn()
  unobserve = jest.fn()
  disconnect = jest.fn()
}
global.IntersectionObserver = IntersectionObserverMock

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})
