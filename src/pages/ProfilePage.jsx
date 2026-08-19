import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Loader2, ChefHat, BookmarkCheck, Calendar, MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useSession } from '../lib/useSession'
import FeedbackSheet from '../components/FeedbackSheet'

const GENERAL_FEEDBACK_OPTIONS = [
  'Feature request',
  'Bug report',
  'Something broke',
  'Love the app',
  'Other',
]

export default function ProfilePage() {
  const navigate = useNavigate()
  const session = useSession()
  const [loading, setLoading]           = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC]">
        <Loader2 size={24} className="animate-spin text-[#E8611A]" />
      </div>
    )
  }

  if (!session) {
    return <GuestProfile navigate={navigate} />
  }

  const user = session.user
  const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      <div className="px-5 pt-14 pb-6">
        <span className="font-display text-2xl font-bold text-[#1A2E1A]">
          raso<span className="text-[#E8611A]">IQ</span>
        </span>
      </div>

      {/* Avatar + name */}
      <div className="mx-5 bg-white rounded-3xl border border-[#EDE8E0] p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#E8611A] flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1A2E1A] text-base truncate">{name}</p>
          <p className="text-xs text-[#9B9490] truncate">{user.email}</p>
        </div>
      </div>

      {/* Menu */}
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

      {/* Feedback + Sign out */}
      <div className="mx-5 mt-4 flex flex-col gap-3">
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE8E0] rounded-2xl py-4 text-sm font-semibold text-[#1A2E1A]"
        >
          <MessageSquare size={16} className="text-[#E8611A]" />
          Send feedback
        </button>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE8E0] rounded-2xl py-4 text-sm font-semibold text-red-500 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
          Sign out
        </button>
      </div>

      {showFeedback && (
        <FeedbackSheet
          type="general"
          options={GENERAL_FEEDBACK_OPTIONS}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  )
}

function GuestProfile({ navigate }) {
  const [showFeedback, setShowFeedback] = useState(false)
  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      <div className="px-5 pt-14 pb-6">
        <span className="font-display text-2xl font-bold text-[#1A2E1A]">
          raso<span className="text-[#E8611A]">IQ</span>
        </span>
      </div>

      {/* Guest avatar */}
      <div className="mx-5 bg-white rounded-3xl border border-[#EDE8E0] p-6 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#EDE8E0] flex items-center justify-center shrink-0">
          <ChefHat size={24} className="text-[#9B9490]" />
        </div>
        <div>
          <p className="font-bold text-[#1A2E1A] text-base">Guest</p>
          <p className="text-xs text-[#9B9490]">Not signed in</p>
        </div>
      </div>

      {/* What you get with an account */}
      <div className="mx-5 mt-5">
        <p className="text-xs font-bold text-[#9B9490] uppercase tracking-wider mb-3">With an account you can</p>
        <div className="flex flex-col gap-2">
          {[
            { icon: BookmarkCheck, text: 'Save recipes for later' },
            { icon: Calendar, text: 'Plan your weekly meals' },
            { icon: ChefHat, text: 'Get personalised suggestions' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5">
              <Icon size={18} className="text-[#E8611A] shrink-0" />
              <span className="text-sm font-medium text-[#1A2E1A]">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="mx-5 mt-6 flex flex-col gap-3">
        <button
          onClick={() => navigate('/auth')}
          className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]"
        >
          Sign in
        </button>
        <button
          onClick={() => navigate('/auth')}
          className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]"
        >
          Create account
        </button>
        <button
          onClick={() => setShowFeedback(true)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#EDE8E0] rounded-2xl py-4 text-sm font-semibold text-[#1A2E1A]"
        >
          <MessageSquare size={16} className="text-[#E8611A]" />
          Send feedback
        </button>
      </div>

      {showFeedback && (
        <FeedbackSheet
          type="general"
          options={GENERAL_FEEDBACK_OPTIONS}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  )
}
