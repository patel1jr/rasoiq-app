import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import { getLocalExtractions, clearLocalExtractions } from '../lib/localExtractions'
import { saveRecipe } from '../lib/api'

async function migrateLocalRecipes(token) {
  const local = getLocalExtractions()
  if (!local.length) return
  try {
    await Promise.all(local.map(e => saveRecipe(e.recipeId, token).catch(() => {})))
    clearLocalExtractions()
  } catch {
    // silent — don't block login if migration fails
  }
}

export default function AuthPage() {
  const navigate = useNavigate()
  const session = useSession()

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC]">
        <Loader2 size={24} className="animate-spin text-[#E8611A]" />
      </div>
    )
  }

  if (session) {
    const pending = localStorage.getItem('pendingRecipe')
    if (pending) {
      localStorage.removeItem('pendingRecipe')
      navigate('/recipe/pending', { replace: true, state: { recipe: JSON.parse(pending) } })
    } else {
      navigate('/', { replace: true })
    }
    return null
  }


  return <LoginScreen navigate={navigate} />
}

function LoginScreen({ navigate }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        await migrateLocalRecipes(data.session.access_token)
        const pending = localStorage.getItem('pendingRecipe')
        if (pending) {
          localStorage.removeItem('pendingRecipe')
          navigate('/recipe/pending', { state: { recipe: JSON.parse(pending) } })
        } else {
          navigate('/')
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setSuccess('Check your email to confirm your account.')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError(null)
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      })
      if (error) throw error
    } catch (err) {
      setError(err.message || 'Google sign-in failed.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC]">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-12 left-5 w-10 h-10 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center"
      >
        <ArrowLeft size={18} className="text-[#5A6B5A]" />
      </button>

      <div className="px-6 pt-24 pb-8">
        <span className="font-display text-3xl font-bold text-[#1A2E1A]">
          raso<span className="text-[#E8611A]">IQ</span>
        </span>
        <p className="mt-2 text-[#5A6B5A] text-[15px]">
          {mode === 'login' ? "Welcome back. Let's cook something great." : 'Create your account to get started.'}
        </p>
      </div>

      <div className="mx-6 flex bg-[#EDE8E0] rounded-2xl p-1 mb-6">
        {['login', 'signup'].map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setSuccess(null) }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              mode === m ? 'bg-white text-[#1A2E1A] shadow-sm' : 'text-[#9B9490]'
            }`}
          >
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="px-6 flex flex-col gap-3">
        {mode === 'signup' && (
          <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5">
            <span className="text-[#C0B8AF] text-sm">👤</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
            />
          </div>
        )}

        <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5">
          <Mail size={17} className="text-[#C0B8AF] shrink-0" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            required
            autoComplete="email"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
        </div>

        <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5">
          <Lock size={17} className="text-[#C0B8AF] shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
          <button type="button" onClick={() => setShowPassword(s => !s)} className="shrink-0">
            {showPassword
              ? <EyeOff size={17} className="text-[#C0B8AF]" />
              : <Eye size={17} className="text-[#C0B8AF]" />
            }
          </button>
        </div>

        {mode === 'login' && (
          <button type="button" className="text-xs font-semibold text-[#E8611A] text-right">
            Forgot password?
          </button>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}
        {success && (
          <p className="text-xs text-[#2D7A5A] bg-[#EAF3EC] border border-[#C5E0CE] rounded-xl px-4 py-3">{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
        >
          {loading && <Loader2 size={18} className="animate-spin" />}
          {mode === 'login' ? 'Log in' : 'Create account'}
        </button>
      </form>

      <div className="mx-6 mt-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-[#EDE8E0]" />
        <span className="text-xs text-[#C0B8AF] font-medium">or</span>
        <div className="flex-1 h-px bg-[#EDE8E0]" />
      </div>

      <div className="px-6 mt-4">
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full bg-white border border-[#EDE8E0] rounded-2xl py-4 flex items-center justify-center gap-3 text-sm font-semibold text-[#1A2E1A] disabled:opacity-50"
        >
          {googleLoading ? <Loader2 size={18} className="animate-spin text-[#9B9490]" /> : <GoogleIcon />}
          Continue with Google
        </button>
      </div>

      {mode === 'signup' && (
        <p className="px-6 mt-5 text-[11px] text-[#9B9490] text-center leading-relaxed">
          By creating an account you agree to our{' '}
          <button className="underline">Terms of Service</button>
          {' '}and{' '}
          <button className="underline">Privacy Policy</button>.
        </p>
      )}
    </div>
  )
}

function ProfileScreen({ session, navigate }) {
  const [loading, setLoading] = useState(false)
  const user = session.user
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      <div className="px-5 pt-14 pb-6">
        <span className="font-display text-2xl font-bold text-[#1A2E1A]">
          raso<span className="text-[#E8611A]">IQ</span>
        </span>
      </div>

      <div className="mx-5 bg-white rounded-3xl border border-[#EDE8E0] p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E8611A] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1A2E1A] text-base truncate">{name}</p>
          <p className="text-xs text-[#9B9490] truncate">{user.email}</p>
        </div>
      </div>

      <div className="mx-5 mt-4 bg-white rounded-3xl border border-[#EDE8E0] overflow-hidden">
        {[
          { label: 'Saved Recipes', path: '/saved' },
          { label: 'Meal Plan', path: '/meal-plan' },
          { label: 'Pantry', path: '/pantry' },
          { label: 'Preferences', path: '/preferences' },
        ].map(({ label, path }, i, arr) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-[#1A2E1A] ${
              i < arr.length - 1 ? 'border-b border-[#F0EBE4]' : ''
            }`}
          >
            {label}
            <span className="text-[#C0B8AF]">›</span>
          </button>
        ))}
      </div>

      <div className="mx-5 mt-4">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE8E0] rounded-2xl py-4 text-sm font-semibold text-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          Sign out
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
