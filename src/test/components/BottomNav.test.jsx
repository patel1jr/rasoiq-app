import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BottomNav from '../../components/BottomNav'

function renderNav(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <BottomNav />
    </MemoryRouter>
  )
}

describe('BottomNav', () => {
  it('renders all 5 tab labels', () => {
    renderNav()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Log')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('Home tab label has saffron color class on / route', () => {
    renderNav('/')
    const homeLabel = screen.getByText('Home')
    expect(homeLabel.className).toContain('text-[#E8611A]')
  })

  it('Discover tab label has saffron color class on /discover route', () => {
    renderNav('/discover')
    const label = screen.getByText('Discover')
    expect(label.className).toContain('text-[#E8611A]')
  })

  it('Saved tab label has saffron color class on /saved route', () => {
    renderNav('/saved')
    const label = screen.getByText('Saved')
    expect(label.className).toContain('text-[#E8611A]')
  })

  it('inactive tabs have muted color class', () => {
    renderNav('/')
    const discoverLabel = screen.getByText('Discover')
    expect(discoverLabel.className).toContain('text-[#C0B8AF]')
  })

  it('renders 5 clickable buttons', () => {
    renderNav()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(5)
  })
})
