import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Heart, Clock, Loader2, BookOpen } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getSavedRecipes } from '../lib/api'

// ─── Helpers ───────────────────────────────────────────────────────────────

function getYouTubeThumbnail(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (!match) return null
  return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
}

function formatTime(mins) {
  if (!mins) return null
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const CUISINE_ACCENT = {
  punjabi:       '#E8611A',
  'south indian':'#2D7A5A',
  gujarati:      '#F5A623',
  bengali:       '#F5A623',
  rajasthani:    '#E8611A',
}

function accentColor(cuisine) {
  if (!cuisine) return '#C0B8AF'
  return CUISINE_ACCENT[cuisine.toLowerCase()] || '#C0B8AF'
}

const FILTERS = ['All', 'Favourites', 'Recently Cooked', 'Vegetarian', 'Non-veg']

function matchesFilter(recipe, filter) {
  if (filter === 'All') return true
  if (filter === 'Favourites') return recipe._saved === true
  if (filter === 'Recently Cooked') return recipe._recentlyCoooked === true
  if (filter === 'Vegetarian') return recipe.dietaryTags?.includes('vegetarian')
  if (filter === 'Non-veg') return !recipe.dietaryTags?.includes('vegetarian')
  return true
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ filtered, onExtract }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center mb-4">
        <BookOpen size={28} className="text-[#E8611A]" />
      </div>
      <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">
        {filtered ? 'No matches' : 'No saved recipes yet'}
      </p>
      <p className="text-sm text-[#9B9490] leading-relaxed mb-6">
        {filtered
          ? 'Try a different filter or search term.'
          : 'Extract recipes from YouTube videos and save them here.'}
      </p>
      {!filtered && (
        <button
          onClick={onExtract}
          className="bg-[#E8611A] text-white font-semibold px-6 py-3 rounded-full text-sm"
        >
          Extract a recipe
        </button>
      )}
    </div>
  )
}

// ─── Recipe card ───────────────────────────────────────────────────────────
function RecipeCard({ recipe, onTap, onUnsave }) {
  const [thumbError, setThumbError] = useState(false)
  const thumbnail = getYouTubeThumbnail(recipe.source?.url)
  const totalTime = recipe.totalTimeMinutes ||
    ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) || null
  const time = formatTime(totalTime)
  const accent = accentColor(recipe.cuisine)

  return (
    <button
      onClick={() => onTap(recipe)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EDE8E0] text-left w-full active:scale-[0.98] transition-transform"
    >
      {/* Cuisine accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accent }} />

      <div className="p-3">
        {/* Thumbnail */}
        <div className="w-full h-24 rounded-xl overflow-hidden bg-[#F0EBE4]">
          {thumbnail && !thumbError ? (
            <img
              src={thumbnail}
              alt={recipe.title}
              className="w-full h-full object-cover"
              onError={() => setThumbError(true)}
            />
          ) : (
            <div
              className="w-full h-full rounded-xl"
              style={{ background: `linear-gradient(135deg, ${accent}33 0%, ${accent}11 100%)` }}
            />
          )}
        </div>

        {/* Title */}
        <p
          className="font-display text-sm font-bold text-[#1A2E1A] mt-2 leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {recipe.title}
        </p>

        {/* Channel */}
        {recipe.source?.channelName && (
          <p className="text-[11px] text-[#9B9490] mt-0.5 truncate">
            By {recipe.source.channelName}
          </p>
        )}

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-2">
          {time ? (
            <span className="text-[11px] text-[#9B9490] bg-[#F0EBE4] rounded-full px-2 py-0.5">
              {time}
            </span>
          ) : (
            <span />
          )}
          <button
            onClick={e => { e.stopPropagation(); onUnsave(recipe) }}
            className="w-7 h-7 rounded-full flex items-center justify-center"
          >
            <Heart size={15} className="text-[#E8611A] fill-[#E8611A]" />
          </button>
        </div>
      </div>
    </button>
  )
}

// ─── Skeleton card ─────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EDE8E0]">
      <div className="h-1 w-full bg-[#EDE8E0]" />
      <div className="p-3">
        <div className="w-full h-24 rounded-xl bg-[#F0EBE4] animate-pulse" />
        <div className="h-3 bg-[#F0EBE4] rounded-full mt-3 animate-pulse w-4/5" />
        <div className="h-3 bg-[#F0EBE4] rounded-full mt-1.5 animate-pulse w-2/5" />
        <div className="flex justify-between mt-3">
          <div className="h-4 w-12 bg-[#F0EBE4] rounded-full animate-pulse" />
          <div className="h-4 w-4 bg-[#F0EBE4] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ─── Unsave confirm sheet ──────────────────────────────────────────────────
function UnsaveSheet({ recipe, onConfirm, onCancel }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">Remove from saved?</p>
        <p className="text-sm text-[#9B9490] mb-6">
          "{recipe.title}" will be removed from your saved recipes.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-[15px]"
          >
            Remove
          </button>
          <button
            onClick={onCancel}
            className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]"
          >
            Keep saved
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function SavedRecipes() {
  const navigate = useNavigate()
  const session = useSession()

  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [unsaveTarget, setUnsaveTarget] = useState(null)

  useEffect(() => {
    if (!session) return
    setLoading(true)
    getSavedRecipes(session.access_token)
      .then(data => setRecipes(Array.isArray(data) ? data : data.recipes || []))
      .catch(() => setError('Could not load your recipes.'))
      .finally(() => setLoading(false))
  }, [session])

  const filtered = useMemo(() => {
    let list = recipes
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => r.title?.toLowerCase().includes(q))
    }
    return list.filter(r => matchesFilter(r, activeFilter))
  }, [recipes, activeFilter, query])

  function openRecipe(recipe) {
    const id = recipe.id || recipe.recipeId
    navigate(id ? `/recipe/${id}` : '/recipe', { state: { recipe } })
  }

  function handleUnsave(recipe) {
    setUnsaveTarget(recipe)
  }

  function confirmUnsave() {
    const id = unsaveTarget.id || unsaveTarget.recipeId
    setRecipes(prev => prev.filter(r => (r.id || r.recipeId) !== id))
    setUnsaveTarget(null)
    // Fire-and-forget unsave API call if endpoint exists
    // unsaveRecipe(id, session.access_token).catch(() => {})
  }

  const isFiltered = activeFilter !== 'All' || query.trim().length > 0

  // Guest wall — show inline prompt instead of redirecting
  if (session === null) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
        <div className="px-5 pt-14 pb-2">
          <h1 className="font-display text-xl font-bold text-[#1A2E1A]">My Recipes</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
          <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-[#E8611A]" />
          </div>
          <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">Sign in to see your recipes</p>
          <p className="text-sm text-[#9B9490] leading-relaxed mb-6">
            Save unlimited recipes and access them across all your devices.
          </p>
          <button
            onClick={() => navigate('/auth')}
            className="bg-[#E8611A] text-white font-semibold px-8 py-3 rounded-full text-sm"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="mt-3 text-sm text-[#9B9490] underline underline-offset-2"
          >
            Create free account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Top bar */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        {searchOpen ? (
          <div className="flex-1 flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-2.5">
            <Search size={16} className="text-[#9B9490] shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search saved recipes…"
              className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
            />
            <button
              onClick={() => { setSearchOpen(false); setQuery('') }}
              className="shrink-0"
            >
              <X size={16} className="text-[#9B9490]" />
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-[#1A2E1A]">My Recipes</h1>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center"
            >
              <Search size={17} className="text-[#5A6B5A]" />
            </button>
          </>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto px-5 mt-4 pb-1 no-scrollbar shrink-0">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              activeFilter === f
                ? 'bg-[#E8611A] text-white border-[#E8611A]'
                : 'bg-white text-[#9B9490] border-[#EDE8E0]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mx-5 mt-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-sm text-[#9B9490] mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              getSavedRecipes(session.access_token)
                .then(data => setRecipes(Array.isArray(data) ? data : data.recipes || []))
                .catch(() => setError('Could not load your recipes.'))
                .finally(() => setLoading(false))
            }}
            className="text-[#E8611A] font-semibold text-sm"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState filtered={isFiltered} onExtract={() => navigate('/extract')} />
      ) : (
        <>
          <p className="text-xs text-[#9B9490] font-medium mx-5 mt-4 mb-1">
            {filtered.length} recipe{filtered.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 mx-5">
            {filtered.map((r, i) => (
              <RecipeCard
                key={r.id || r.recipeId || i}
                recipe={r}
                onTap={openRecipe}
                onUnsave={handleUnsave}
              />
            ))}
          </div>
        </>
      )}

      {/* Unsave confirmation sheet */}
      {unsaveTarget && (
        <UnsaveSheet
          recipe={unsaveTarget}
          onConfirm={confirmUnsave}
          onCancel={() => setUnsaveTarget(null)}
        />
      )}
    </div>
  )
}
