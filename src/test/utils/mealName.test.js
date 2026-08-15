import { describe, it, expect } from 'vitest'
import { getMealName } from '../../utils/mealName'

describe('getMealName', () => {
  it('returns customName as-is when provided', () => {
    expect(getMealName({ customName: 'My Special Dal' })).toBe('My Special Dal')
  })

  it('converts stapleId underscores to title-cased words', () => {
    expect(getMealName({ stapleId: 'dal_roti' })).toBe('Dal Roti')
  })

  it('converts single-word stapleId correctly', () => {
    expect(getMealName({ stapleId: 'biryani' })).toBe('Biryani')
  })

  it('returns recipeTitle when no customName or stapleId', () => {
    expect(getMealName({ recipeTitle: 'Butter Chicken' })).toBe('Butter Chicken')
  })

  it('falls back to "Meal" when nothing available', () => {
    expect(getMealName({})).toBe('Meal')
  })

  it('falls back to "Meal" when called with no args', () => {
    expect(getMealName()).toBe('Meal')
  })

  it('prefers customName over stapleId', () => {
    expect(getMealName({ customName: 'Custom', stapleId: 'dal_roti' })).toBe('Custom')
  })

  it('prefers stapleId over recipeTitle', () => {
    expect(getMealName({ stapleId: 'rajma_chawal', recipeTitle: 'Rajma' })).toBe('Rajma Chawal')
  })
})
