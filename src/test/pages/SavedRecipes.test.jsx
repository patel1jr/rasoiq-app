import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => ({ access_token: 'tok' })),
}))

vi.mock('../../lib/api', () => ({
  getSavedRecipes: vi.fn(),
  getCollections: vi.fn(),
  createCollection: vi.fn(),
  addToCollection: vi.fn(),
  removeFromCollection: vi.fn(),
  unsaveRecipe: vi.fn(),
}))

import SavedRecipes from '../../pages/SavedRecipes'
import { useSession } from '../../lib/useSession'
import { getSavedRecipes, getCollections, createCollection } from '../../lib/api'

const MOCK_RECIPES = [
  {
    userRecipeId: 'ur1',
    recipeId: 'r1',
    title: 'Dal Makhani',
    channelName: 'Hebbars Kitchen',
    sourceUrl: 'https://youtube.com/watch?v=abc123',
    collections: [],
  },
  {
    userRecipeId: 'ur2',
    recipeId: 'r2',
    title: 'Butter Chicken',
    channelName: 'Ranveer Brar',
    sourceUrl: 'https://youtube.com/watch?v=def456',
    collections: [{ id: 'col1', name: 'Favourites', emoji: '⭐' }],
  },
]

const MOCK_COLLECTIONS = [
  { id: 'col1', name: 'Favourites', emoji: '⭐', recipeCount: 1 },
]

function renderSaved(session = { access_token: 'tok' }) {
  useSession.mockReturnValue(session)
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<SavedRecipes />} />
        <Route path="/discover" element={<div>Discover</div>} />
        <Route path="/auth" element={<div>Auth</div>} />
        <Route path="/recipe/:id" element={<div>Recipe</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('SavedRecipes (My Cookbook)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSavedRecipes.mockResolvedValue(MOCK_RECIPES)
    getCollections.mockResolvedValue(MOCK_COLLECTIONS)
  })

  it('renders My Cookbook heading', async () => {
    renderSaved()
    await waitFor(() =>
      expect(screen.getByText(/My Cookbook/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('shows All Recipes card after data loads', async () => {
    renderSaved()
    await waitFor(() =>
      expect(screen.getByText(/All Recipes/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('shows collection cards with emoji and name', async () => {
    renderSaved()
    await waitFor(() =>
      // Collection renders as "⭐ Favourites" in a single text node
      expect(screen.getByText(/Favourites/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('shows New collection dashed card', async () => {
    renderSaved()
    await waitFor(() =>
      expect(screen.getByText(/New collection/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('shows empty state when no saved recipes', async () => {
    getSavedRecipes.mockResolvedValue([])
    getCollections.mockResolvedValue([])
    renderSaved()
    await waitFor(() =>
      expect(screen.getByText(/Your cookbook is empty/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('tapping All Recipes opens collection view with all recipes', async () => {
    renderSaved()
    const user = userEvent.setup()
    await waitFor(() => screen.getByText(/All Recipes/i), { timeout: 3000 })
    await user.click(screen.getByText(/📚 All Recipes/i))
    await waitFor(() =>
      expect(screen.getByText('Dal Makhani')).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('tapping a collection opens it and shows matching recipes', async () => {
    renderSaved()
    const user = userEvent.setup()
    await waitFor(() => screen.getByText(/Favourites/i), { timeout: 3000 })
    // Click the collection button
    const collectionBtn = screen.getByText(/Favourites/i).closest('button')
    await user.click(collectionBtn)
    await waitFor(() =>
      expect(screen.getByText('Butter Chicken')).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('opening New collection card shows create sheet', async () => {
    renderSaved()
    const user = userEvent.setup()
    await waitFor(() => screen.getByText(/New collection/i), { timeout: 3000 })
    await user.click(screen.getByText(/New collection/i))
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/Baby Food/i)).toBeInTheDocument(),
      { timeout: 3000 }
    )
  })

  it('create collection button disabled until name entered', async () => {
    renderSaved()
    const user = userEvent.setup()
    await waitFor(() => screen.getByText(/New collection/i), { timeout: 3000 })
    await user.click(screen.getByText(/New collection/i))
    await waitFor(() => screen.getByPlaceholderText(/Baby Food/i), { timeout: 3000 })
    // Click create without entering a name — should not call createCollection
    await user.click(screen.getByRole('button', { name: /create/i }))
    expect(createCollection).not.toHaveBeenCalled()
  })
})
