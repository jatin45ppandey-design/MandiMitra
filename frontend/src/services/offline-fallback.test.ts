import { describe, expect, it } from 'vitest'
import { ApiError, canUseOfflineFallback } from './api'

describe('offline fallback policy', () => {
  it('uses genuine bundled data when server is down', () => {
    expect(canUseOfflineFallback(new ApiError('timeout'))).toBe(true)
    expect(canUseOfflineFallback(new ApiError('unavailable', 503))).toBe(true)
    expect(canUseOfflineFallback(new ApiError('rate limited', 429))).toBe(true)
  })
  it('does not hide wrong requests or authentication failures', () => {
    expect(canUseOfflineFallback(new ApiError('invalid', 422))).toBe(false)
    expect(canUseOfflineFallback(new ApiError('forbidden', 403))).toBe(false)
    expect(canUseOfflineFallback(new Error('unknown'))).toBe(false)
  })
})
