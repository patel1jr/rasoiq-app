import { describe, it, expect, beforeEach } from 'vitest'
import { getStreak, recordCookToday } from '../../utils/streak'

const STREAK_KEY = 'rasoiq_streak'

beforeEach(() => localStorage.clear())

describe('getStreak', () => {
  it('returns count 0 and null lastDate when nothing stored', () => {
    const streak = getStreak()
    expect(streak.count).toBe(0)
    expect(streak.lastDate).toBeNull()
  })

  it('returns stored streak values', () => {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 5, lastDate: '2025-01-10' }))
    const streak = getStreak()
    expect(streak.count).toBe(5)
    expect(streak.lastDate).toBe('2025-01-10')
  })

  it('returns defaults on invalid JSON', () => {
    localStorage.setItem(STREAK_KEY, 'not-json')
    const streak = getStreak()
    expect(streak.count).toBe(0)
    expect(streak.lastDate).toBeNull()
  })
})

describe('recordCookToday', () => {
  it('starts streak at 1 when no prior history', () => {
    const result = recordCookToday()
    expect(result.count).toBe(1)
    expect(result.lastDate).toBe(new Date().toISOString().slice(0, 10))
  })

  it('returns same streak if already recorded today', () => {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 3, lastDate: today }))
    const result = recordCookToday()
    expect(result.count).toBe(3)
  })

  it('increments streak when last date was yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 4, lastDate: yesterday }))
    const result = recordCookToday()
    expect(result.count).toBe(5)
  })

  it('resets streak to 1 when gap in meals', () => {
    localStorage.setItem(STREAK_KEY, JSON.stringify({ count: 10, lastDate: '2020-01-01' }))
    const result = recordCookToday()
    expect(result.count).toBe(1)
  })
})
