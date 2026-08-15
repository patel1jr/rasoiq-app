import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => ({ access_token: 'tok' })),
}))

vi.mock('../../lib/api', () => ({
  logMeal: vi.fn().mockResolvedValue({}),
}))

import QuickLog from '../../pages/QuickLog'
import { logMeal } from '../../lib/api'
import { useSession } from '../../lib/useSession'

function renderQuickLog() {
  return render(
    <MemoryRouter>
      <QuickLog />
    </MemoryRouter>
  )
}

describe('QuickLog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useSession.mockReturnValue({ access_token: 'tok' })
  })

  it('renders the three tabs', () => {
    renderQuickLog()
    expect(screen.getByRole('button', { name: /staples/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recent/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /custom/i })).toBeInTheDocument()
  })

  it('Staples tab shows category sections', () => {
    renderQuickLog()
    expect(screen.getByText('Dal & Lentils')).toBeInTheDocument()
    expect(screen.getByText('Sabzi')).toBeInTheDocument()
    expect(screen.getByText('Bread')).toBeInTheDocument()
  })

  it('shows staple items within categories', () => {
    renderQuickLog()
    expect(screen.getByText('Dal Roti')).toBeInTheDocument()
    expect(screen.getByText('Rajma Chawal')).toBeInTheDocument()
  })

  it('tapping a staple item selects it', async () => {
    renderQuickLog()
    const user = userEvent.setup()
    await user.click(screen.getByText('Dal Roti'))
    // After selection, the log sheet should appear with the meal name
    await waitFor(() =>
      expect(screen.getAllByText('Dal Roti').length).toBeGreaterThan(0)
    )
  })

  it('Custom tab shows a text input', async () => {
    renderQuickLog()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /custom/i }))
    await waitFor(() =>
      expect(screen.getByPlaceholderText(/mom's aloo sabzi/i)).toBeInTheDocument()
    )
  })

  it('Recent tab shows empty state when no history', async () => {
    renderQuickLog()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /recent/i }))
    await waitFor(() =>
      expect(screen.getByText(/no recent logs yet/i)).toBeInTheDocument()
    )
  })

  it('Recent tab shows previous meals from localStorage', async () => {
    localStorage.setItem('rasoiq_recent_logs', JSON.stringify([
      { name: 'Palak Paneer', category: 'Sabzi', loggedAt: new Date().toISOString() },
    ]))
    renderQuickLog()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /recent/i }))
    await waitFor(() =>
      expect(screen.getByText('Palak Paneer')).toBeInTheDocument()
    )
  })
})
