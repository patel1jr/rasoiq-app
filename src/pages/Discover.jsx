import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { SlidersHorizontal, Smartphone, Check, Loader2, AlertCircle, X, Lock, Clock } from 'lucide-react'
import { extractRecipe, getSavedRecipes } from '../lib/api'
import { useSession } from '../lib/useSession'
import { getLocalExtractions, addLocalExtraction, isAtLimit, FREE_LIMIT } from '../lib/localExtractions'
import ExtractionLoader from '../components/ExtractionLoader'

const CUISINES = [
  { icon: '🍛', name: 'Punjabi'     },
  { icon: '🥥', name: 'South Indian'},
  { icon: '🫓', name: 'Gujarati'    },
  { icon: '🐟', name: 'Bengali'     },
  { icon: '🌍', name: 'Global'      },
  { icon: '🥗', name: 'Healthy'     },
]

function isValidYouTubeUrl(url) {
  return url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/shorts/')
}

function relativeDate(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff} days ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function Discover() {
  const [url, setUrl]               = useState('')
  const [loading, setLoading]       = useState(false)
  const [stage, setStage]           = useState(-1)
  const [error, setError]           = useState(null)
  const [urlError, setUrlError]     = useState(null)
  const [showLimitSheet, setShowLimitSheet] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const inputRef = useRef(null)
  const session  = useSession()

  const [recentFromApi, setRecentFromApi] = useState(null)
  const [sharedFromYouTube, setSharedFromYouTube] = useState(false)
  const extractBtnRef = useRef(null)
  const localExtractions = getLocalExtractions()

  // Web Share Target — read URL shared from Android share sheet
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedUrl = params.get('url') || params.get('text') || params.get('title')
    if (!sharedUrl) return

    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/
    if (youtubeRegex.test(sharedUrl)) {
      const urlMatch = sharedUrl.match(/https?:\/\/[^\s]+/)
      const extracted = urlMatch ? urlMatch[0] : sharedUrl
      setUrl(extracted)
      setUrlError(null)
      setSharedFromYouTube(true)
      // Clear query params so a refresh doesn't re-trigger
      window.history.replaceState({}, '', '/discover')
      // Auto-focus Extract button after state settles
      setTimeout(() => extractBtnRef.current?.focus(), 100)
      // Dismiss banner after 3 s
      setTimeout(() => setSharedFromYouTube(false), 3000)
    }
  }, [])

  // Auto-fill URL from popular recipe tap on Home
  useEffect(() => {
    const prefill = location.state?.prefillUrl
    if (prefill) {
      setUrl(prefill)
      setUrlError(null)
      // Replace the state so a back-navigation doesn't re-trigger
      window.history.replaceState({}, '')
    }
  }, [location.state?.prefillUrl])

  useEffect(() => {
    if (session) {
      getSavedRecipes(session.access_token)
        .then(data => setRecentFromApi(Array.isArray(data) ? data : data?.recipes || []))
        .catch(() => setRecentFromApi([]))
    } else if (session === null) {
      setRecentFromApi(null)
    }
  }, [session])

  const recentItems = session ? (recentFromApi || []) : localExtractions

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text); setUrlError(null)
    } catch { inputRef.current?.focus() }
  }

  async function handleExtract(e) {
    e?.preventDefault()
    if (!url.trim() || loading) return
    if (!isValidYouTubeUrl(url.trim())) {
      setUrlError('Please enter a valid YouTube URL (youtube.com or youtu.be)')
      return
    }
    setUrlError(null)
    if (!session && isAtLimit()) { setShowLimitSheet(true); return }

    setError(null); setLoading(true); setStage(0)
    const t1 = setTimeout(() => setStage(1), 8000)
    const t2 = setTimeout(() => setStage(2), 20000)

    try {
      const recipe = await extractRecipe(url.trim())
      clearTimeout(t1); clearTimeout(t2)
      addLocalExtraction(recipe, !!session)
      const recipeId = recipe.id || recipe.recipeId
      navigate(recipeId ? `/recipe/${recipeId}` : '/recipe', { state: { recipe } })
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2)
      const msg = err?.detail || err?.title || ''
      setError(
        msg.toLowerCase().includes('transcript') || msg.toLowerCase().includes('caption')
          ? "This video doesn't have captions. Try a different video."
          : msg || 'Could not extract recipe from this video.'
      )
      setLoading(false); setStage(-1)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-3 pb-0">
        <h1 className="m-0 text-[23px] font-extrabold text-[#1A2E1A] tracking-tight">Discover</h1>
        <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          style={{boxShadow:'0 2px 8px -4px rgba(26,46,26,.25)'}}>
          <SlidersHorizontal size={17} strokeWidth={2} className="text-[#1A2E1A]" />
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pt-[14px] pb-4">

        {/* Web Share Target banner */}
        {sharedFromYouTube && (
          <div className="mx-[22px] mb-3 px-4 py-3 rounded-[14px] flex items-center gap-2.5"
            style={{background: 'rgba(232,97,26,0.10)', border: '1.5px solid rgba(232,97,26,0.25)'}}>
            <span className="text-base leading-none">📺</span>
            <p className="flex-1 text-[13px] font-semibold text-[#C2511A]">YouTube video ready to extract</p>
            <button onClick={() => setSharedFromYouTube(false)} className="text-[#C2511A]/60 hover:text-[#C2511A]">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Extraction card */}
        <div className="mx-[22px] bg-white rounded-[20px] p-4" style={{opacity: loading ? 0.9 : 1, boxShadow:'0 8px 20px -16px rgba(26,46,26,.35)'}}>
          <p className="text-[11px] font-bold uppercase tracking-[.07em] text-[#E8611A] mb-2.5">Extract from video</p>

          {/* URL input */}
          <div className={`flex items-center gap-2.5 rounded-[13px] px-3.5 h-[50px] ${urlError ? 'bg-red-50 border border-red-200' : 'bg-[#FAF3E7] border-[1.5px] border-[#1A2E1A]/10'}`}>
            <Smartphone size={17} strokeWidth={2} className="text-[#6B5B4E] shrink-0" />
            <input
              ref={inputRef}
              type="url"
              value={url}
              onChange={e => { setUrl(e.target.value); setUrlError(null) }}
              placeholder="Paste YouTube URL here"
              className="flex-1 text-[14px] bg-transparent outline-none placeholder:text-[#1A2E1A]/45 min-w-0"
              style={{color: url ? '#1A2E1A' : undefined}}
              disabled={loading}
            />
            <button type="button" onClick={handlePaste} disabled={loading}
              className="shrink-0 h-[34px] px-[13px] rounded-[9px] bg-[#E8611A] text-white text-[12.5px] font-bold"
              style={{opacity: loading ? 0.4 : 1}}>
              Paste
            </button>
          </div>

          {urlError && <p className="text-xs text-red-500 mt-1.5 px-1">{urlError}</p>}

          {/* CTA */}
          <button
            ref={extractBtnRef}
            onClick={handleExtract}
            disabled={loading || !url.trim()}
            className="mt-3 w-full h-[50px] rounded-[25px] text-white text-[15.5px] font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
            style={{background: loading ? 'rgba(194,81,26,.55)' : '#C2511A', boxShadow:'0 8px 18px -8px rgba(194,81,26,.7)'}}>
            {loading && <span className="w-[15px] h-[15px] rounded-full border-[2.5px] border-white/40 border-t-white inline-block animate-spin" />}
            {loading ? 'Extracting…' : 'Extract Recipe'}
          </button>

          {/* Extraction loader */}
          {loading && <ExtractionLoader />}

          {/* Error */}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-3.5 py-3 flex gap-2.5 items-start">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="flex-1 text-[12.5px] text-red-600">{error}</p>
              <button onClick={() => { setError(null); setUrl('') }} className="text-xs text-red-400 font-bold shrink-0">✕</button>
            </div>
          )}
        </div>

        {/* Browse sections — hide while loading */}
        {!loading && (
          <>
            {/* Recently extracted */}
            {recentItems.length > 0 && (
              <section className="mt-6">
                <div className="flex items-baseline justify-between px-[22px] pb-3">
                  <span className="text-[12px] font-bold uppercase tracking-[.07em] text-[#6B5B4E]">Recently extracted</span>
                  <span className="text-[13px] font-semibold text-[#E8611A]">See all</span>
                </div>
                <div className="flex gap-3 overflow-x-auto px-[22px] pb-1" style={{scrollbarWidth:'none'}}>
                  {recentItems.slice(0, session ? 5 : 3).map((item, i) => {
                    const rid = item.recipeId || item.recipe?.id
                    const author = item.channelName || item.recipe?.source?.channelName
                    return (
                      <button key={rid || i}
                        onClick={() => navigate(rid ? `/recipe/${rid}` : '/recipe', { state: { recipe: item.recipe || item } })}
                        className="shrink-0 w-[180px] text-left bg-white rounded-[16px] overflow-hidden cursor-pointer"
                        style={{boxShadow:'0 6px 16px -14px rgba(26,46,26,.4)'}}>
                        <div className="h-[90px]" style={{backgroundImage:'repeating-linear-gradient(135deg,#F3E2C4 0 11px,#EFD9B2 11px 22px)'}} />
                        <div className="px-3 pt-[11px] pb-[13px]">
                          <p className="text-[14px] font-bold text-[#1A2E1A] leading-tight line-clamp-2">{item.title}</p>
                          {author && <p className="mt-[5px] text-[11px] font-medium text-[#6B5B4E]">By {author}</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Cuisine grid */}
            <section className="mx-[22px] mt-6">
              <span className="text-[12px] font-bold uppercase tracking-[.07em] text-[#6B5B4E]">Browse saved by cuisine</span>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {CUISINES.map(cu => (
                  <button key={cu.name}
                    onClick={() => navigate('/saved?cuisine=' + encodeURIComponent(cu.name))}
                    className="bg-white rounded-[16px] py-4 px-2 flex flex-col items-center gap-1.5 cursor-pointer"
                    style={{boxShadow:'0 4px 14px -12px rgba(26,46,26,.35)'}}>
                    <span className="text-[24px]">{cu.icon}</span>
                    <span className="text-[13.5px] font-bold text-[#1A2E1A]">{cu.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Quick or leisurely */}
            <section className="mx-[22px] mt-6 mb-1">
              <span className="text-[12px] font-bold uppercase tracking-[.07em] text-[#6B5B4E]">Quick or leisurely?</span>
              <div className="mt-3 flex gap-2.5">
                <button className="flex-1 rounded-[16px] p-4 text-left border"
                  style={{background:'#FCF0E5', borderColor:'rgba(232,97,26,.2)'}}>
                  <span className="text-[20px]">⚡</span>
                  <p className="mt-2 text-[14px] font-bold text-[#1A2E1A]">Under 30 min</p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B5B4E]">Quick meals</p>
                </button>
                <button className="flex-1 rounded-[16px] p-4 text-left border"
                  style={{background:'#EAEEE9', borderColor:'rgba(26,46,26,.12)'}}>
                  <span className="text-[20px]">🕐</span>
                  <p className="mt-2 text-[14px] font-bold text-[#1A2E1A]">Weekend cooking</p>
                  <p className="mt-0.5 text-[12px] font-medium text-[#6B5B4E]">Slow & flavourful</p>
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Limit sheet */}
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
              <button onClick={() => navigate('/auth')} className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]">Create free account</button>
              <button onClick={() => navigate('/auth')} className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]">Sign in</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
