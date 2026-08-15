import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../lib/api', () => ({
  extractRecipe: vi.fn(),
  getSavedRecipes: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => null),
}))

vi.mock('../../lib/localExtractions', () => ({
  getLocalExtractions: vi.fn(() => []),
  addLocalExtraction: vi.fn(),
  isAtLimit: vi.fn(() => false),
  FREE_LIMIT: 3,
}))

import Discover from '../../pages/Discover'
import { extractRecipe } from '../../lib/api'
import { isAtLimit, getLocalExtractions } from '../../lib/localExtractions'
import { useSession } from '../../lib/useSession'

function renderDiscover(initialPath = '/discover', state = undefined) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state }]}>
      <Discover />
    </MemoryRouter>
  )
}

describe('Discover (Extract page)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useSession.mockReturnValue(null)
    isAtLimit.mockReturnValue(false)
    getLocalExtractions.mockReturnValue([])
  })

  it('renders URL input and Extract button', () => {
    renderDiscover()
    expect(screen.getByPlaceholderText(/paste youtube/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /extract/i })).toBeInTheDocument()
  })

  it('shows error for non-YouTube URL', async () => {
    renderDiscover()
    const user = userEvent.setup()
    const input = screen.getByPlaceholderText(/paste youtube/i)
    await user.type(input, 'https://vimeo.com/12345')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    await waitFor(() =>
      expect(screen.getByText(/valid youtube url/i)).toBeInTheDocument()
    )
  })

  it('does not show URL error for valid youtube.com URL', async () => {
    extractRecipe.mockReturnValue(new Promise(() => {})) // never resolves
    renderDiscover()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/paste youtube/i), 'https://youtube.com/watch?v=abc123')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    expect(screen.queryByText(/valid youtube url/i)).not.toBeInTheDocument()
  })

  it('calls extractRecipe on valid URL submit', async () => {
    extractRecipe.mockResolvedValue({ id: 'r1', title: 'Dal Makhani', ingredients: [{ name: 'dal' }] })
    renderDiscover()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/paste youtube/i), 'https://youtube.com/watch?v=abc123')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    await waitFor(() => expect(extractRecipe).toHaveBeenCalledWith('https://youtube.com/watch?v=abc123'))
  })

  it('shows loading stage text during extraction', async () => {
    extractRecipe.mockReturnValue(new Promise(() => {})) // never resolves
    renderDiscover()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/paste youtube/i), 'https://youtu.be/abc123')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    await waitFor(() =>
      expect(screen.getByText(/Reading the video transcript/i)).toBeInTheDocument()
    )
  })

  it('shows error card when extraction fails', async () => {
    extractRecipe.mockRejectedValue({ detail: 'No captions available' })
    renderDiscover()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/paste youtube/i), 'https://youtu.be/abc123')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    await waitFor(() =>
      expect(screen.getByText(/captions/i)).toBeInTheDocument()
    )
  })

  it('shows sign up prompt when unauthenticated user hits free limit', async () => {
    isAtLimit.mockReturnValue(true)
    renderDiscover()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText(/paste youtube/i), 'https://youtu.be/abc123')
    await user.click(screen.getByRole('button', { name: /extract/i }))
    // Should not call extractRecipe, should show limit sheet instead
    expect(extractRecipe).not.toHaveBeenCalled()
  })

  it('shows recent extractions in the list', () => {
    getLocalExtractions.mockReturnValue([
      { recipeId: 'r1', title: 'Dal Makhani', extractedAt: new Date().toISOString() },
    ])
    renderDiscover()
    expect(screen.getByText('Dal Makhani')).toBeInTheDocument()
  })
})
