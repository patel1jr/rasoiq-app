import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getTrendingRecipes, getTrendingCuisines, saveRecipe } from '../lib/api'
import { getVideoId } from '../utils/videoId'

// ── cuisine helpers ───────────────────────────────────────────────────────────

const CUISINE_COLORS = {
  'punjabi':      '#E8611A',
  'north indian': '#F5A623',
  'south indian': '#2D7A5A',
  'hyderabadi':   '#9B2335',
  'bengali':      '#6B8CAE',
  'gujarati':     '#F5A623',
  'street food':  '#E8836A',
  'global':       '#6B8CAE',
  'healthy':      '#2D7A5A',
}

function accentFor(region) {
  if (!region) return '#6B5B4E'
  const r = region.toLowerCase()
  for (const [key, color] of Object.entries(CUISINE_COLORS)) {
    if (r.includes(key)) return color
  }
  return '#6B5B4E'
}

// Returns null if the tag should be hidden ("Other", null, blank)
function visibleCuisineTag(region, title, channelName) {
  if (!region || region.toLowerCase() === 'other') {
    const haystack = `${title ?? ''} ${channelName ?? ''}`.toLowerCase()
    if (haystack.includes('punjabi') || haystack.includes('dhaba'))                        return 'Punjabi'
    if (haystack.includes('south indian') || haystack.includes('idli') || haystack.includes('dosa')) return 'South Indian'
    if (haystack.includes('hyderabadi') || haystack.includes('biryani'))                   return 'Hyderabadi'
    if (haystack.includes('bengali') || haystack.includes('mishti'))                       return 'Bengali'
    if (haystack.includes('gujarati') || haystack.includes('thepla'))                      return 'Gujarati'
    if (haystack.includes('street food') || haystack.includes('chaat'))                    return 'Street Food'
    return null
  }
  return region
}

function saveLabel(count) {
  if (count >= 5) return `🔥 ${count}`
  if (count >= 2) return `✨ ${count}`
  return 'New'
}

// ── card ──────────────────────────────────────────────────────────────────────

function BottomRow({ recipe }) {
  return (
    <div className="flex items-center justify-between mt-2">
      <div className="flex items-center gap-1.5">
        {recipe.totalTimeMinutes && (
          <span className="text-[11px] bg-[#F0EBE4] text-[#6B5B4E] rounded-full px-2 py-0.5">
            {recipe.totalTimeMinutes < 60
              ? `${Math.round(recipe.totalTimeMinutes)}m`
              : `${Math.floor(recipe.totalTimeMinutes / 60)}h`}
          </span>
        )}
        {recipe.dietaryTags?.some(t => t.toLowerCase().includes('vegetarian')) && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600 shrink-0" />
            <span className="text-[11px] font-semibold text-green-700">Veg</span>
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold text-[#E8611A]">
        {saveLabel(recipe.savedByCount)}
      </span>
    </div>
  )
}

// Single unified card — accent bar always visible; image shown only once loaded
function RecipeCard({ recipe, onSave }) {
  const navigate = useNavigate()
  const [saved,        setSaved]        = useState(recipe.isSaved ?? false)
  const [saving,       setSaving]       = useState(false)
  const [imgLoaded,    setImgLoaded]    = useState(false)
  const [imgError,     setImgError]     = useState(false)

  const accent  = accentFor(recipe.cuisineRegion)
  const tag     = visibleCuisineTag(recipe.cuisineRegion, recipe.title, recipe.channelName)

  const videoId = getVideoId(recipe.sourceUrl)
  const imgSrc  = recipe.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null)

  if (import.meta.env.DEV) {
    console.log('[Trending] sourceUrl:', recipe.sourceUrl, '→ videoId:', videoId, '→ imgSrc:', imgSrc)
  }

  const showImage = !!(imgSrc && !imgError && imgLoaded)
  const hasImg    = !!(imgSrc && !imgError) // still trying or succeeded

  function handleLoad(e) {
    if (e.target.naturalWidth <= 120) { setImgError(true); return }
    setImgLoaded(true)
  }

  function handleSave(e) { e.stopPropagation(); onSave(recipe, setSaved, setSaving) }

  return (
    <button
      className="w-full text-left bg-white rounded-2xl overflow-hidden flex flex-col"
      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe: { ...recipe, recipeId: recipe.id } } })}
      style={{ boxShadow: '0 4px 16px -10px rgba(26,46,26,.3)', minHeight: 180 }}
    >
      {/* Accent bar — always present */}
      <div style={{ height: 4, background: accent, borderRadius: '12px 12px 0 0', flexShrink: 0 }} />

      {/* Thumbnail — hidden until loaded, no flash */}
      {hasImg && (
        <img
          src={imgSrc}
          alt={recipe.title}
          loading="lazy"
          className="w-full object-cover"
          style={{ height: showImage ? 96 : 0, display: 'block' }}
          onLoad={handleLoad}
          onError={() => setImgError(true)}
        />
      )}

      {/* Body */}
      <div className="p-3 flex flex-col flex-1 relative">
        {/* Heart */}
        <button onClick={handleSave} disabled={saving} className="absolute top-2 right-2">
          <Heart
            size={15}
            className={saved ? 'text-[#E8611A]' : 'text-[#C0B8AF]'}
            fill={saved ? '#E8611A' : 'none'}
            strokeWidth={2}
          />
        </button>

        {/* Cuisine tag — only when no image showing (text-forward mode) */}
        {!showImage && tag && (
          <p className="text-[10px] font-bold uppercase tracking-[.08em] mb-1.5 pr-5"
            style={{ color: accent }}>
            {tag}
          </p>
        )}

        {/* Title */}
        <p className={`font-bold text-[#1A2E1A] leading-snug line-clamp-2 pr-5 ${showImage ? 'text-sm' : 'text-[15px] font-extrabold'}`}>
          {recipe.title}
        </p>

        {recipe.channelName && (
          <p className="text-xs text-[#9B9490] mt-1 truncate">By {recipe.channelName}</p>
        )}

        <div className="mt-auto">
          <BottomRow recipe={recipe} />
        </div>
      </div>
    </button>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ minHeight: 180 }}>
      <div className="h-1 bg-[#E8611A]/30" />
      <div className="h-24 bg-[#1A2E1A]/10" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-[#1A2E1A]/10 rounded-full w-4/5" />
        <div className="h-3 bg-[#1A2E1A]/8 rounded-full w-3/5" />
        <div className="h-3 bg-[#1A2E1A]/6 rounded-full w-2/5 mt-1" />
      </div>
    </div>
  )
}

function SignUpSheet({ onClose, onSignIn }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl px-6 pt-5 pb-12">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-5" />
        <div className="text-4xl mb-3 text-center">❤️</div>
        <h3 className="text-xl font-extrabold text-[#1A2E1A] text-center mb-2">Save this recipe</h3>
        <p className="text-sm text-[#6B5B4E] text-center mb-6">
          Create a free account to save recipes to your cookbook and plan your meals.
        </p>
        <button onClick={onSignIn}
          className="w-full rounded-full py-3.5 text-white text-[15px] font-bold"
          style={{ background: '#C2511A', boxShadow: '0 8px 18px -8px rgba(194,81,26,.7)' }}>
          Get started free
        </button>
        <button onClick={onClose} className="w-full mt-3 text-sm font-semibold text-[#9B9490] py-2">
          Not now
        </button>
      </div>
    </>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Trending() {
  const navigate = useNavigate()
  const session  = useSession()

  const [cuisines, setCuisines]           = useState([])
  const [activeCuisine, setActiveCuisine] = useState(null)
  const [recipes, setRecipes]             = useState([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [loadingMore, setLoadingMore]     = useState(false)
  const [signUpSheet, setSignUpSheet]     = useState(null)

  const PAGE = 20

  useEffect(() => {
    getTrendingCuisines().catch(() => []).then(setCuisines)
  }, [])

  useEffect(() => {
    setLoading(true)
    setRecipes([])
    getTrendingRecipes(activeCuisine, PAGE, 0, session?.access_token)
      .then(data => { setRecipes(data.recipes ?? []); setTotal(data.total ?? 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeCuisine, session?.access_token])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const data = await getTrendingRecipes(activeCuisine, PAGE, recipes.length, session?.access_token)
      setRecipes(prev => [...prev, ...(data.recipes ?? [])])
      setTotal(data.total ?? 0)
    } catch { /* silent */ }
    finally { setLoadingMore(false) }
  }

  const handleSave = useCallback((recipe, setSaved, setSaving) => {
    if (!session) { setSignUpSheet(recipe); return }
    setSaving(true)
    saveRecipe(recipe.id, session.access_token)
      .then(() => setSaved(true))
      .catch(() => {})
      .finally(() => setSaving(false))
  }, [session])

  const hasMore = recipes.length < total

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Header */}
      <div className="px-4 pt-14 pb-0">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold text-[#1A2E1A] tracking-tight">Trending</h1>
          <span className="text-2xl leading-none">🔥</span>
        </div>
        <p className="text-xs text-[#9B9490] mt-0.5">Popular recipes from the rasoIQ community</p>
      </div>

      {/* Cuisine filter chips */}
      <div className="flex gap-2 overflow-x-auto px-4 mt-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {['All', ...cuisines].map(c => {
          const isAll    = c === 'All'
          const isActive = isAll ? activeCuisine === null : activeCuisine === c
          return (
            <button key={c}
              onClick={() => setActiveCuisine(isAll ? null : c)}
              className="shrink-0 px-4 h-8 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                background: isActive ? '#E8611A' : '#fff',
                color:      isActive ? '#fff'     : '#6B5B4E',
                border:     isActive ? 'none'     : '1px solid rgba(26,46,26,.12)',
              }}>
              {c}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <div className="mx-4 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <span className="text-6xl">🍳</span>
            <p className="text-lg font-bold text-[#1A2E1A]">No trending recipes yet</p>
            <p className="text-sm text-[#9B9490]">Be the first to extract one!</p>
            <button onClick={() => navigate('/discover')}
              className="mt-2 h-12 px-6 rounded-full text-white text-[14px] font-bold"
              style={{ background: '#C2511A' }}>
              Extract a recipe
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {recipes.map(r => (
                <RecipeCard key={r.id} recipe={r} onSave={handleSave} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-5">
                <button onClick={loadMore} disabled={loadingMore}
                  className="h-11 px-8 rounded-full text-[14px] font-bold border-2 disabled:opacity-50"
                  style={{ borderColor: '#E8611A', color: '#E8611A' }}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {signUpSheet && (
        <SignUpSheet
          onClose={() => setSignUpSheet(null)}
          onSignIn={() => navigate('/auth')}
        />
      )}
    </div>
  )
}
