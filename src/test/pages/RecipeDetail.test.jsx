import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => null),
}))

vi.mock('../../lib/api', () => ({
  getRecipe: vi.fn(),
  saveRecipe: vi.fn(),
  unsaveRecipe: vi.fn(),
  getSavedRecipes: vi.fn().mockResolvedValue([]),
  getCollections: vi.fn().mockResolvedValue([]),
  createCollection: vi.fn(),
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
}))

vi.mock('../../lib/localExtractions', () => ({
  getLocalExtractions: vi.fn(() => []),
  FREE_LIMIT: 3,
}))

import RecipePage from '../../pages/RecipePage'
import { useSession } from '../../lib/useSession'
import { saveRecipe, getSavedRecipes } from '../../lib/api'

const MOCK_RECIPE = {
  id: 'recipe-1',
  title: 'Dal Makhani',
  source: { channelName: 'Hebbars Kitchen', url: 'https://youtube.com/watch?v=abc123' },
  totalTimeMinutes: 45,
  activeTimeMinutes: 20,
  servings: 4,
  difficultyLevel: 'easy',
  cuisineRegion: 'Punjabi',
  ingredients: [
    { name: 'Whole urad dal', quantity: 1, unit: 'cup', preparation: '' },
    { name: 'Butter', quantity: 2, unit: 'tbsp', preparation: '' },
  ],
  steps: [
    { order: 1, instruction: 'Soak dal overnight.' },
    { order: 2, instruction: 'Pressure cook for 8 whistles.' },
    { order: 3, instruction: 'Add butter and simmer for 30 minutes.' },
  ],
  techniques: [
    { id: 'simmering', displayName: 'Simmering', category: 'heat' },
  ],
  dietaryTags: [],
}

function renderRecipe(recipe = MOCK_RECIPE, session = null) {
  useSession.mockReturnValue(session)
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/recipe', state: { recipe } }]}>
      <Routes>
        <Route path="/recipe" element={<RecipePage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/cook/:id" element={<div>Cook Mode</div>} />
        <Route path="/auth" element={<div>Auth Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RecipePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getSavedRecipes.mockResolvedValue([])
  })

  it('renders recipe title', () => {
    renderRecipe()
    expect(screen.getByText('Dal Makhani')).toBeInTheDocument()
  })

  it('renders total time in stats', () => {
    renderRecipe()
    expect(screen.getByText('45m')).toBeInTheDocument()
  })

  it('renders servings count', async () => {
    renderRecipe()
    // '4' appears in both the stat bar and the serving adjuster
    await waitFor(() => expect(screen.getAllByText('4').length).toBeGreaterThan(0))
  })

  it('shows source attribution with channel name', () => {
    renderRecipe()
    expect(screen.getByText('Hebbars Kitchen')).toBeInTheDocument()
  })

  it('renders ingredients tab content by default', () => {
    renderRecipe()
    expect(screen.getByText('Whole urad dal')).toBeInTheDocument()
    expect(screen.getByText('Butter')).toBeInTheDocument()
  })

  it('switches to steps tab on click', async () => {
    renderRecipe()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /steps/i }))
    await waitFor(() =>
      expect(screen.getByText('Soak dal overnight.')).toBeInTheDocument()
    )
  })

  it('switches to techniques tab and shows technique names not "Technique"', async () => {
    renderRecipe()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /techniques/i }))
    await waitFor(() => {
      expect(screen.getByText('Simmering')).toBeInTheDocument()
    })
    expect(screen.queryByText(/^Technique$/)).not.toBeInTheDocument()
  })

  it('serving adjuster doubles quantities when servings doubled', async () => {
    renderRecipe()
    const user = userEvent.setup()
    // Click the + button twice (4 → 6 to increase)
    const plusBtn = screen.getByRole('button', { name: '+' })
    await user.click(plusBtn)
    await user.click(plusBtn)
    // The quantity for dal was 1 cup (4 servings), at 6 servings it should scale
    // Look for "1.5" (1 × 6/4 = 1.5)
    await waitFor(() =>
      expect(screen.getByText(/1\.5/)).toBeInTheDocument()
    )
  })

  it('heart button triggers auth sheet for unauthenticated users', async () => {
    renderRecipe(MOCK_RECIPE, null)
    const user = userEvent.setup()
    const heartBtn = screen.getByRole('button', { name: /save/i })
    await user.click(heartBtn)
    await waitFor(() =>
      expect(screen.getByText(/sign in to save/i)).toBeInTheDocument()
    )
  })

  it('heart button calls saveRecipe when authenticated', async () => {
    saveRecipe.mockResolvedValue({ userRecipeId: 'ur1' })
    renderRecipe(MOCK_RECIPE, { access_token: 'tok' })
    const user = userEvent.setup()
    const heartBtn = screen.getByRole('button', { name: /save/i })
    await user.click(heartBtn)
    await waitFor(() => expect(saveRecipe).toHaveBeenCalledWith(expect.any(String), 'tok'))
  })

  it('Start Cooking button navigates to cook mode when authenticated', async () => {
    renderRecipe(MOCK_RECIPE, { access_token: 'tok' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /start cooking/i }))
    await waitFor(() =>
      expect(screen.getByText('Cook Mode')).toBeInTheDocument()
    )
  })
})
