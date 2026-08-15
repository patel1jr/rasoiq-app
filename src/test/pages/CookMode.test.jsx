import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => null),
}))

vi.mock('../../lib/api', () => ({
  getRecipe: vi.fn(),
  logMeal: vi.fn().mockResolvedValue({}),
}))

import CookMode from '../../pages/CookMode'
import { useSession } from '../../lib/useSession'
import { logMeal } from '../../lib/api'

const MOCK_RECIPE = {
  id: 'r1',
  title: 'Dal Makhani',
  steps: [
    { order: 1, instruction: 'Soak dal overnight in cold water.' },
    { order: 2, instruction: 'Pressure cook for 8 whistles on high heat.' },
    { order: 3, instruction: 'Add butter and cream and simmer for 30 minutes.', durationMinutes: 30 },
  ],
}

function renderCook(recipe = MOCK_RECIPE, session = null) {
  useSession.mockReturnValue(session)
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/cook/r1', state: { recipe } }]}>
      <Routes>
        <Route path="/cook/:id" element={<CookMode />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('CookMode', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows step 1 of N progress indicator', () => {
    renderCook()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
  })

  it('renders first step instruction', () => {
    renderCook()
    // The instruction appears in both a heading and a paragraph — check at least one exists
    expect(screen.getAllByText('Soak dal overnight in cold water.').length).toBeGreaterThan(0)
  })

  it('advances to next step on Next button click', async () => {
    renderCook()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() =>
      expect(screen.getByText('Pressure cook for 8 whistles on high heat.')).toBeInTheDocument()
    )
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
  })

  it('goes back to previous step on Back button', async () => {
    renderCook()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() => screen.getByText('Step 2 of 3'))
    await user.click(screen.getByRole('button', { name: /previous step/i }))
    await waitFor(() =>
      expect(screen.getAllByText('Soak dal overnight in cold water.').length).toBeGreaterThan(0)
    )
  })

  it('shows completion screen after last step', async () => {
    renderCook()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /finish|next/i }))
    await waitFor(() =>
      expect(screen.getByText('Dal Makhani, done!')).toBeInTheDocument()
    )
  })

  it('completion screen shows Cook again button', async () => {
    renderCook()
    const user = userEvent.setup()
    // Skip to completion
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /finish|next/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /cook again/i })).toBeInTheDocument()
    )
  })

  it('Cook again resets to step 1', async () => {
    renderCook()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /finish|next/i }))
    await waitFor(() => screen.getByRole('button', { name: /cook again/i }))
    await user.click(screen.getByRole('button', { name: /cook again/i }))
    await waitFor(() =>
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    )
  })

  it('calls logMeal on completion when authenticated', async () => {
    renderCook(MOCK_RECIPE, { access_token: 'tok' })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /finish|next/i }))
    await waitFor(() => expect(logMeal).toHaveBeenCalled())
  })

  it('shows step timer for steps with durationMinutes', async () => {
    renderCook()
    const user = userEvent.setup()
    // Step 3 has durationMinutes: 30
    await user.click(screen.getByRole('button', { name: /next/i }))
    await user.click(screen.getByRole('button', { name: /next/i }))
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument()
    )
  })
})
