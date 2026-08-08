import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Smartphone, Check, Loader2, AlertCircle, UtensilsCrossed, X, Lock, Clock, ChefHat, ChevronRight } from 'lucide-react'
import { extractRecipe, getSavedRecipes } from '../lib/api'
import { useSession } from '../lib/useSession'
import { getLocalExtractions, getRecentExtractions, addLocalExtraction, isAtLimit, FREE_LIMIT } from '../lib/localExtractions'

const STAGES = [
  { id: 'fetch', label: 'Fetching video transcript' },
  { id: 'extract', label: 'Extracting recipe with AI' },
  { id: 'structure', label: 'Structuring ingredients & steps' },
]

function isValidYouTubeUrl(url) {
  return url.includes('youtube.com/watch') ||
    url.includes('youtu.be/') ||
    url.includes('youtube.com/shorts/')
}

export default function ExtractPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(-1)
  const [error, setError] = useState(null)
  const [urlError, setUrlError] = useState(null)
  const [showLimitSheet, setShowLimitSheet] = useState(false)
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const session = useSession()

  const [recentFromApi, setRecentFromApi] = useState(null) // null = not fetched yet
  const localExtractions = getLocalExtractions()
  const localCount = localExtractions.length
  const recentLocalExtractions = getRecentExtractions(7)

  useEffect(() => {
    if (session) {
      getSavedRecipes(session.access_token)
        .then(data => setRecentFromApi(Array.isArray(data) ? data : data?.recipes || []))
        .catch(() => setRecentFromApi([]))
    } else {
      setRecentFromApi(null)
    }
  }, [session])

  // Signed-in: use API (saved recipes). Guests: last 7 days from localStorage.
  const recentItems = session
    ? (recentFromApi || [])
    : recentLocalExtractions

  // Avatar initials for signed-in user
  const avatarInitial = session
    ? (session.user.user_metadata?.full_name?.[0] || session.user.email?.[0] || '?').toUpperCase()
    : null

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      setUrlError(null)
    } catch {
      inputRef.current?.focus()
    }
  }

  async function handleExtract(e) {
    e?.preventDefault()
    if (!url.trim() || loading) return

    // URL validation
    if (!isValidYouTubeUrl(url.trim())) {
      setUrlError('Please enter a valid YouTube URL (youtube.com or youtu.be)')
      return
    }
    setUrlError(null)

    // Guest limit check
    if (!session && isAtLimit()) {
      setShowLimitSheet(true)
      return
    }

    setError(null)
    setLoading(true)
    setStage(0)

    const t1 = setTimeout(() => setStage(1), 8000)
    const t2 = setTimeout(() => setStage(2), 20000)

    try {
      const recipe = await extractRecipe(url.trim())
      clearTimeout(t1)
      clearTimeout(t2)

      addLocalExtraction(recipe, !!session)

      const recipeId = recipe.id || recipe.recipeId
      navigate(recipeId ? `/recipe/${recipeId}` : '/recipe', { state: { recipe } })
    } catch (err) {
      clearTimeout(t1)
      clearTimeout(t2)
      const msg = err?.detail || err?.title || ''
      setError(
        msg.toLowerCase().includes('transcript') || msg.toLowerCase().includes('caption')
          ? "This video doesn't have captions. Try a different video."
          : msg || 'Could not extract recipe from this video.'
      )
      setLoading(false)
      setStage(-1)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <span className="font-display text-2xl font-bold text-[#1A2E1A]">
          raso<span className="text-[#E8611A]">IQ</span>
        </span>
        {session ? (
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-[#E8611A] flex items-center justify-center"
          >
            <span className="text-white text-sm font-bold">{avatarInitial}</span>
          </button>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-semibold text-[#E8611A]"
          >
            Sign in
          </button>
        )}
      </div>

      {/* Hero text */}
      <div className="px-5 pt-6 pb-8">
        <h1 className="font-display text-[2rem] leading-tight font-bold text-[#1A2E1A] mb-2">
          Aaj kya banau?
        </h1>
        <p className="text-[#5A6B5A] text-[15px] leading-relaxed">
          Paste any Indian cooking video link — get a full recipe in seconds.
        </p>
      </div>

      {/* Input card */}
      <div className="px-5">
        <form onSubmit={handleExtract}>
          <div className="bg-white rounded-3xl shadow-sm border border-[#EDE8E0] p-5 flex flex-col gap-4">
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${urlError ? 'bg-red-50 border border-red-200' : 'bg-[#F7F3EE]'}`}>
              <Smartphone size={18} className={urlError ? 'text-red-400 shrink-0' : 'text-[#C0B8AF] shrink-0'} />
              <input
                ref={inputRef}
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlError(null) }}
                placeholder="youtube.com/watch?v=..."
                className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF] min-w-0"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handlePaste}
                disabled={loading}
                className="shrink-0 text-xs font-semibold text-[#E8611A] bg-[#E8611A]/10 px-3 py-1.5 rounded-xl"
              >
                Paste
              </button>
            </div>

            {urlError && (
              <p className="text-xs text-red-500 -mt-2 px-1">{urlError}</p>
            )}

            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="w-full bg-[#E8611A] text-white font-semibold py-4 rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2 text-[15px] transition-opacity"
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Extracting…</>
              ) : (
                'Extract Recipe'
              )}
            </button>
          </div>
        </form>

        {/* Guest usage indicator */}
        {!session && localCount > 0 && (
          <div className="mt-3 flex items-center justify-between bg-[#FEF0E8] rounded-2xl px-4 py-3">
            <span className="text-xs font-medium text-[#C2511A]">
              {localCount} of {FREE_LIMIT} free recipes used
            </span>
            <button onClick={() => navigate('/auth')} className="text-xs font-bold text-[#E8611A]">
              Sign in for unlimited →
            </button>
          </div>
        )}

        {/* Loading stages */}
        {loading && (
          <div className="mt-4 bg-white rounded-3xl border border-[#EDE8E0] px-5 py-5 flex flex-col gap-4">
            {STAGES.map((s, i) => {
              const done = i < stage
              const active = i === stage
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    done ? 'bg-[#2D7A5A]' : active ? 'border-2 border-[#E8611A]' : 'border-2 border-[#DDD8D0]'
                  }`}>
                    {done ? <Check size={13} className="text-white" strokeWidth={3} />
                      : active ? <div className="w-2.5 h-2.5 rounded-full bg-[#E8611A] animate-pulse" />
                      : null}
                  </div>
                  <span className={`text-sm ${
                    done ? 'text-[#2D7A5A] font-medium' : active ? 'text-[#1A2E1A] font-semibold' : 'text-[#BDB8B0]'
                  }`}>{s.label}</span>
                </div>
              )
            })}
            <p className="text-xs text-[#BDB8B0] mt-1">This takes 30–60 seconds the first time</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl px-4 py-4 flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700 font-medium mb-1">Couldn't extract recipe</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
            <button onClick={() => { setError(null); setUrl('') }} className="text-xs text-red-500 font-semibold shrink-0">
              Try again
            </button>
          </div>
        )}

        {/* Log a meal CTA */}
        <div className="mt-5">
          <button
            onClick={() => navigate('/log')}
            className="w-full bg-white border border-[#EDE8E0] rounded-2xl p-4 flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FEF0E8] flex items-center justify-center shrink-0">
              <ChefHat size={18} className="text-[#E8611A]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#1A2E1A]">Log a meal you cooked</p>
              <p className="text-xs text-[#9B9490] truncate mt-0.5">Dal Roti, Aloo Sabzi, Rajma…</p>
            </div>
            <ChevronRight size={18} className="text-[#C0B8AF] shrink-0" />
          </button>
        </div>

        {/* Recent extractions */}
        {!loading && recentItems.length > 0 && (
          <div className="mt-7 pb-8">
            <p className="text-xs font-bold text-[#9B9490] uppercase tracking-wider mb-3">Recent</p>
            <div className="flex flex-col gap-2">
              {recentItems.slice(0, 10).map((item, i) => {
                const id = item.recipeId || item.userRecipeId
                const title = item.title
                const date = item.savedAt || item.extractedAt
                return (
                  <button
                    key={id || i}
                    onClick={() => {
                      if (item.recipe) {
                        navigate(id ? `/recipe/${id}` : '/recipe', { state: { recipe: item.recipe } })
                      } else if (id) {
                        navigate(`/recipe/${id}`)
                      }
                    }}
                    className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5 text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-[#FEF0E8] flex items-center justify-center shrink-0">
                      <Clock size={15} className="text-[#E8611A]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2E1A] truncate">{title}</p>
                      <p className="text-xs text-[#9B9490]">
                        {date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[#C0B8AF] shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Limit reached sheet */}
      {showLimitSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowLimitSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-12">
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 rounded-full bg-[#FEF0E8] flex items-center justify-center">
                <Lock size={18} className="text-[#E8611A]" />
              </div>
              <button onClick={() => setShowLimitSheet(false)} className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center">
                <X size={16} className="text-[#5A6B5A]" />
              </button>
            </div>
            <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-2">
              You've used all {FREE_LIMIT} free recipes
            </h3>
            <p className="text-sm text-[#5A6B5A] leading-relaxed mb-6">
              Create a free account to extract unlimited recipes, save your favourites, and plan your meals.
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => navigate('/auth')} className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]">
                Create free account
              </button>
              <button onClick={() => navigate('/auth')} className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]">
                Sign in
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
