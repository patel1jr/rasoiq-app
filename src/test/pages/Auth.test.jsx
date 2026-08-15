import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mock supabase before importing the component
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

vi.mock('../../lib/useSession', () => ({
  useSession: vi.fn(() => null),
}))

vi.mock('../../lib/api', () => ({
  saveRecipe: vi.fn(),
}))

vi.mock('../../lib/localExtractions', () => ({
  getLocalExtractions: vi.fn(() => []),
  clearLocalExtractions: vi.fn(),
}))

import AuthPage from '../../pages/AuthPage'
import { supabase } from '../../lib/supabase'

function renderAuth() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>
  )
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders sign in form by default', () => {
    renderAuth()
    // There are two "Log in" texts: the tab and the submit button
    expect(screen.getAllByText('Log in').length).toBeGreaterThan(0)
    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
  })

  it('toggles to sign up form', async () => {
    renderAuth()
    const user = userEvent.setup()
    await user.click(screen.getByText('Sign up'))
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    expect(screen.getByText('Create account')).toBeInTheDocument()
  })

  it('calls signInWithPassword on login submit', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'tok' } },
      error: null,
    })
    renderAuth()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Email address'), 'test@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'password123')
    // Two "Log in" buttons exist (tab + submit); click the submit (last) one
    const loginBtns = screen.getAllByRole('button', { name: /log in/i })
    await user.click(loginBtns[loginBtns.length - 1])
    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    )
  })

  it('shows error message on invalid credentials', async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    })
    renderAuth()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Email address'), 'bad@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'wrong')
    // Two "Log in" buttons exist (tab + submit); click the submit (last) one
    const loginBtns = screen.getAllByRole('button', { name: /log in/i })
    await user.click(loginBtns[loginBtns.length - 1])
    await waitFor(() =>
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    )
  })

  it('calls signInWithOAuth on Google button click', async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null })
    renderAuth()
    const user = userEvent.setup()
    await user.click(screen.getByText('Continue with Google'))
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
  })

  it('shows loading spinner during auth', async () => {
    // Never resolves so spinner stays visible
    supabase.auth.signInWithPassword.mockReturnValue(new Promise(() => {}))
    renderAuth()
    const user = userEvent.setup()
    await user.type(screen.getByPlaceholderText('Email address'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('Password'), 'pass')
    // Two "Log in" buttons exist (tab + submit); click the submit (last) one
    const loginBtns = screen.getAllByRole('button', { name: /log in/i })
    await user.click(loginBtns[loginBtns.length - 1])
    // Submit button should be disabled during loading
    await waitFor(() => {
      const btns = screen.getAllByRole('button', { name: /log in/i })
      expect(btns[btns.length - 1]).toBeDisabled()
    })
  })

  it('calls signUp when sign up form is submitted', async () => {
    supabase.auth.signUp.mockResolvedValue({ error: null })
    renderAuth()
    const user = userEvent.setup()
    await user.click(screen.getByText('Sign up'))
    await user.type(screen.getByPlaceholderText('Your name'), 'Test User')
    await user.type(screen.getByPlaceholderText('Email address'), 'new@example.com')
    await user.type(screen.getByPlaceholderText('Password'), 'newpass123')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => expect(supabase.auth.signUp).toHaveBeenCalled())
  })
})
