import { QueryClient } from '@tanstack/react-query'
import { QueryCache } from '../QueryCache'

describe('QueryCache', () => {
  let queryClient: QueryClient
  let queryCache: QueryCache

  beforeEach(() => {
    queryClient = new QueryClient()
    queryCache = new QueryCache(queryClient, {
      ttl: 1000,
      maxItems: 5,
    })
  })

  afterEach(() => {
    queryClient.clear()
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should set and get query data', async () => {
    const testData = { id: 1, name: 'Test' }
    
    // Set data
    queryCache.setQueryData('test', 'key', testData)
    
    // Get data
    const cachedData = queryCache.getQueryData('test', 'key')
    
    expect(cachedData).toEqual(testData)
  })

  it('should handle namespace invalidation', async () => {
    // Set multiple items in same namespace
    queryCache.setQueryData('test', 'key1', { id: 1 })
    queryCache.setQueryData('test', 'key2', { id: 2 })
    queryCache.setQueryData('other', 'key3', { id: 3 })

    // Invalidate test namespace
    await queryCache.invalidateNamespace('test')

    // Check data
    expect(queryCache.getQueryData('test', 'key1')).toBeUndefined()
    expect(queryCache.getQueryData('test', 'key2')).toBeUndefined()
    expect(queryCache.getQueryData('other', 'key3')).toBeDefined()
  })

  it('should respect TTL for cache freshness', async () => {
    const testData = { id: 1 }
    
    // Set data
    queryCache.setQueryData('test', 'key', testData)
    
    // Check freshness immediately
    expect(queryCache.isQueryFresh('test', 'key')).toBe(true)
    
    // Advance time beyond TTL
    jest.advanceTimersByTime(2000)
    
    // Should no longer be fresh
    expect(queryCache.isQueryFresh('test', 'key')).toBe(false)
  })

  it('should handle prefetch queries', async () => {
    const testData = { id: 1 }
    const fetcher = jest.fn().mockResolvedValue(testData)

    // Prefetch data
    await queryCache.prefetchQuery('test', 'key', fetcher)

    // Verify data was fetched and cached
    expect(fetcher).toHaveBeenCalled()
    expect(queryCache.getQueryData('test', 'key')).toEqual(testData)
  })

  it('should provide accurate cache statistics', async () => {
    // Set some data
    queryCache.setQueryData('test', 'key1', { id: 1 })
    queryCache.setQueryData('test', 'key2', { id: 2 })

    // Get stats
    const stats = queryCache.getCacheStats()

    expect(stats).toEqual(expect.objectContaining({
      totalQueries: expect.any(Number),
      staleQueries: expect.any(Number),
      activeQueries: expect.any(Number),
    }))
  })

  it('should handle cache clearing', async () => {
    // Set some data
    queryCache.setQueryData('test', 'key1', { id: 1 })
    queryCache.setQueryData('test', 'key2', { id: 2 })

    // Clear cache
    await queryCache.clearCache()

    // Verify all data is cleared
    expect(queryCache.getQueryData('test', 'key1')).toBeUndefined()
    expect(queryCache.getQueryData('test', 'key2')).toBeUndefined()
  })

  it('should persist cache to localStorage', async () => {
    const testData = { id: 1 }
    
    // Set data
    queryCache.setQueryData('test', 'key', testData)
    
    // Verify localStorage was called
    expect(localStorage.setItem).toHaveBeenCalled()
  })
})

