import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase fires an AUTH_STATE_CHANGE with type PASSWORD_RECOVERY
    // after processing the token from the email link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] items-center justify-center px-8 text-center">
        <span className="text-5xl mb-5">✅</span>
        <h1 className="text-xl font-extrabold text-[#1A2E1A] mb-2">Password updated</h1>
        <p className="text-sm text-[#6B5B4E] mb-6">You can now sign in with your new password.</p>
        <button
          onClick={() => navigate('/auth', { replace: true })}
          className="h-12 px-8 rounded-full text-white text-[15px] font-bold"
          style={{ background: '#C2511A' }}>
          Sign in
        </button>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC]">
        <Loader2 size={24} className="animate-spin text-[#E8611A]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] px-6 pt-20">
      <h1 className="text-2xl font-extrabold text-[#1A2E1A] mb-1">Set new password</h1>
      <p className="text-sm text-[#6B5B4E] mb-8">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 h-[52px]">
          <Lock size={17} className="text-[#9B9490] shrink-0" />
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className="flex-1 text-[15px] bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
          <button type="button" onClick={() => setShowPassword(p => !p)} className="text-[#9B9490]">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="h-[52px] rounded-full text-white text-[15px] font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#C2511A' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
