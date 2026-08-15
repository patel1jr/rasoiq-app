import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => null),
}))

vi.mock('../../lib/api', () => ({
  getWeekMealPlan: vi.fn().mockResolvedValue([]),
  getSavedRecipes: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../lib/localExtractions', () => ({
  getLocalExtractions: vi.fn(() => []),
}))

import Home from '../../pages/Home'
import { useSession } from '../../lib/useSession'
import { getLocalExtractions } from '../../lib/localExtractions'
import { getWeekMealPlan, getSavedRecipes } from '../../lib/api'

function renderHome(session = null) {
  useSession.mockReturnValue(session)
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<div>Auth Page</div>} />
        <Route path="/discover" element={<div>Discover Page</div>} />
        <Route path="/log" element={<div>Log Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    getLocalExtractions.mockReturnValue([])
  })

  describe('new unauthenticated visitor', () => {
    it('shows the rasoIQ wordmark', () => {
      renderHome(null)
      expect(screen.getAllByText(/rasoIQ|rasoi/i).length).toBeGreaterThan(0)
    })

    it('shows Sign in button', () => {
      renderHome(null)
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('shows Welcome banner', () => {
      renderHome(null)
      expect(screen.getByText(/Welcome to rasoIQ/i)).toBeInTheDocument()
    })

    it('shows popular Indian recipes section', () => {
      renderHome(null)
      expect(screen.getByText('Dal Makhani')).toBeInTheDocument()
      expect(screen.getByText('Butter Chicken')).toBeInTheDocument()
    })

    it('shows How it Works section', () => {
      renderHome(null)
      expect(screen.getByText(/Paste a YouTube link/i)).toBeInTheDocument()
    })

    it('popular recipe tap navigates to Discover', async () => {
      renderHome(null)
      const user = userEvent.setup()
      await user.click(screen.getByText('Dal Makhani'))
      await waitFor(() =>
        expect(screen.getByText('Discover Page')).toBeInTheDocument()
      )
    })
  })

  describe('authenticated user with no data', () => {
    const mockSession = {
      access_token: 'tok',
      user: { email: 'test@example.com', user_metadata: { full_name: 'Test User' } },
    }

    beforeEach(() => {
      getSavedRecipes.mockResolvedValue([])
      getWeekMealPlan.mockResolvedValue([])
    })

    it('shows personalized greeting with user first name', async () => {
      renderHome(mockSession)
      await waitFor(() =>
        expect(screen.getByText(/Test/i)).toBeInTheDocument()
      )
    })

    it('shows greeting based on time of day', () => {
      renderHome(mockSession)
      const greetings = ['Good morning', 'Good afternoon', 'Good evening']
      const found = greetings.some(g => screen.queryByText(new RegExp(g, 'i')))
      expect(found).toBe(true)
    })

    it('renders the weekly calendar strip', () => {
      renderHome(mockSession)
      // WeekStrip renders day abbreviations Mon-Sun
      const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
      // Each day shows a button or div — just verify the strip container renders
      expect(screen.getByText(/Mon|Tue|Wed|Thu|Fri|Sat|Sun|lunch|dinner|plan/i, { exact: false })).toBeInTheDocument()
    })
  })
})
