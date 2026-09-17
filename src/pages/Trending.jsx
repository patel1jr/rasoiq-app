import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getTrendingRecipes, getTrendingCuisines, saveRecipe } from '../lib/api'
import { getVideoId } from '../utils/videoId'

// ── helpers ───────────────────────────────────────────────────────────────────

function cuisineEmoji(region) {
  if (!region) return '🍳'
  const r = region.toLowerCase()
  if (r.includes('south indian')) return '🥥'
  if (r.includes('punjabi'))      return '🍛'
  if (r.includes('bengali'))      return '🐟'
  if (r.includes('gujarati'))     return '🫓'
  if (r.includes('hyderabadi'))   return '🍚'
  return '🍳'
}

function saveLabel(count) {
  if (count >= 5)  return `🔥 ${count}`
  if (count >= 2)  return `✨ ${count}`
  return 'New'
}

// ── sub-components ────────────────────────────────────────────────────────────

function RecipeThumb({ sourceUrl, cuisineRegion, className = 'w-full h-28 object-cover' }) {
  const [err, setErr] = useState(false)
  const videoId = getVideoId(sourceUrl)

  if (videoId && !err) {
    return (
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt=""
        className={className}
        onError={() => setErr(true)}
        onLoad={(e) => { if (e.target.naturalWidth <= 120) setErr(true) }}
      />
    )
  }
  return (
    <div className="w-full h-28 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg,#E8611A 0%,#C4510F 100%)' }}>
      <span className="text-4xl">{sourceUrl && !videoId ? '🌐' : cuisineEmoji(cuisineRegion)}</span>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-28 bg-[#1A2E1A]/10" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-3.5 bg-[#1A2E1A]/10 rounded-full w-4/5" />
        <div className="h-3 bg-[#1A2E1A]/08 rounded-full w-3/5" />
        <div className="h-3 bg-[#1A2E1A]/06 rounded-full w-2/5 mt-1" />
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
        <button
          onClick={onSignIn}
          className="w-full h-13 rounded-full py-3.5 text-white text-[15px] font-bold"
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

function RecipeCard({ recipe, onSave }) {
  const navigate = useNavigate()
  const [saved, setSaved] = useState(recipe.isSaved ?? false)
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.stopPropagation()
    onSave(recipe, setSaved, setSaving)
  }

  return (
    <button
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm relative"
      onClick={() => navigate(`/recipe/${recipe.id}`, { state: { recipe: { ...recipe, recipeId: recipe.id } } })}
      style={{ boxShadow: '0 4px 16px -10px rgba(26,46,26,.3)' }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden rounded-t-2xl">
        <RecipeThumb sourceUrl={recipe.sourceUrl} cuisineRegion={recipe.cuisineRegion} />

        {/* Save button overlay */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
          style={{ backdropFilter: 'blur(4px)' }}>
          <Heart
            size={15}
            className={saved ? 'text-[#E8611A]' : 'text-[#9B9490]'}
            fill={saved ? '#E8611A' : 'none'}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="text-sm font-bold text-[#1A2E1A] leading-snug line-clamp-2">{recipe.title}</p>
        {recipe.channelName && (
          <p className="text-xs text-[#9B9490] mt-1 truncate">By {recipe.channelName}</p>
        )}

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
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0" />
                <span className="text-[11px] font-semibold text-green-700">Veg</span>
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-[#E8611A]">
            {saveLabel(recipe.savedByCount)}
          </span>
        </div>
      </div>
    </button>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Trending() {
  const navigate = useNavigate()
  const session  = useSession()

  const [cuisines, setCuisines]     = useState([])
  const [activeCuisine, setActiveCuisine] = useState(null)
  const [recipes, setRecipes]       = useState([])
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [signUpSheet, setSignUpSheet] = useState(null) // recipe being saved when unauthenticated

  const PAGE = 20

  // Fetch cuisine chips on mount
  useEffect(() => {
    getTrendingCuisines().catch(() => []).then(setCuisines)
  }, [])

  // Fetch recipes when cuisine filter changes
  useEffect(() => {
    setLoading(true)
    setRecipes([])
    getTrendingRecipes(activeCuisine, PAGE, 0, session?.access_token)
      .then(data => {
        setRecipes(data.recipes ?? [])
        setTotal(data.total ?? 0)
      })
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
    if (!session) {
      setSignUpSheet(recipe)
      return
    }
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
            <button
              key={c}
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
            <button
              onClick={() => navigate('/discover')}
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
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-11 px-8 rounded-full text-[14px] font-bold border-2 disabled:opacity-50"
                  style={{ borderColor: '#E8611A', color: '#E8611A' }}>
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sign-up sheet */}
      {signUpSheet && (
        <SignUpSheet
          onClose={() => setSignUpSheet(null)}
          onSignIn={() => navigate('/auth')}
        />
      )}
    </div>
  )
}
