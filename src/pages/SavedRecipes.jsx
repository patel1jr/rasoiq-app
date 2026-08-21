import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Plus, Search, MoreHorizontal, Loader2, X, ChevronRight } from 'lucide-react'
import { useSession } from '../lib/useSession'
import {
  getSavedRecipes, getCollections, createCollection,
  addToCollection, removeFromCollection, unsaveRecipe,
} from '../lib/api'

// ── helpers ───────────────────────────────────────────────────────────────────

const COLLECTION_GRADIENTS = [
  ['#E8611A', '#C4510F'], // saffron
  ['#6BAE75', '#4A8F54'], // sage green
  ['#F5A623', '#D4891C'], // turmeric
  ['#E8836A', '#C4614A'], // coral
  ['#6B8CAE', '#4A6B8F'], // slate blue
  ['#6BAEB0', '#4A8F91'], // mint
]

const NAMED_GRADIENTS = {
  'favourites':   COLLECTION_GRADIENTS[0],
  'baby food':    COLLECTION_GRADIENTS[1],
  'quick':        COLLECTION_GRADIENTS[2],
  'south indian': COLLECTION_GRADIENTS[3],
  'global':       COLLECTION_GRADIENTS[4],
  'healthy':      COLLECTION_GRADIENTS[5],
  'spicy':        COLLECTION_GRADIENTS[4],
  'weekend':      COLLECTION_GRADIENTS[3],
}

function getGradient(name = '', index = 0) {
  const key = Object.keys(NAMED_GRADIENTS).find(k => name.toLowerCase().includes(k))
  return key ? NAMED_GRADIENTS[key] : COLLECTION_GRADIENTS[index % COLLECTION_GRADIENTS.length]
}

function GradientCard({ emoji, name, height = 'h-40', index = 0, allRecipes = false }) {
  const [from, to] = allRecipes
    ? ['#D5C9BA', '#BFB3A4']
    : getGradient(name, index)
  return (
    <div
      className={`${height} flex items-center justify-center relative overflow-hidden rounded-t-2xl`}
      style={{ background: `linear-gradient(145deg, ${from} 0%, ${to} 100%)` }}
    >
      {/* subtle diagonal texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`diag-${index}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="12" stroke="white" strokeWidth="3" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#diag-${index})`} />
      </svg>
      <span className="text-5xl relative" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}>
        {emoji}
      </span>
    </div>
  )
}

// ── skeleton ──────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="min-h-screen bg-[#FDF6EC] pb-24">
      <div className="px-4 pt-14 pb-3 flex items-center justify-between">
        <div className="h-7 w-36 bg-[#1A2E1A]/10 rounded-xl animate-pulse" />
        <div className="h-9 w-9 bg-[#1A2E1A]/10 rounded-full animate-pulse" />
      </div>
      <div className="mx-4 h-11 rounded-full bg-[#1A2E1A]/08 animate-pulse mb-4" />
      <div className="mx-4 grid grid-cols-2 gap-3">
        <div className="col-span-2 h-52 rounded-2xl bg-[#1A2E1A]/08 animate-pulse" />
        {[1,2,3,4].map(i => (
          <div key={i} className="h-52 rounded-2xl bg-[#1A2E1A]/08 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

// ── action sheet ──────────────────────────────────────────────────────────────
function ActionSheet({ recipe, collectionId, collectionName, onClose, onRemoveFromCollection, onUnsave }) {
  const navigate = useNavigate()
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl px-5 pt-3 pb-10">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-4" />
        <p className="text-[13px] font-semibold text-[#9B9490] mb-4 truncate">{recipe.title}</p>
        <div className="flex flex-col gap-1">
          <button onClick={() => { navigate(`/recipe/${recipe.recipeId}`, { state: { recipe } }); onClose() }}
            className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-[#1A2E1A] hover:bg-[#F5F0EA]">
            🍳 Start cooking
          </button>
          <button onClick={() => { onClose() }}
            className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-[#1A2E1A] hover:bg-[#F5F0EA]">
            📂 Add to another collection
          </button>
          {collectionId && (
            <button onClick={() => { onRemoveFromCollection(); onClose() }}
              className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-red-500 hover:bg-red-50">
              Remove from {collectionName}
            </button>
          )}
          <button onClick={() => { onUnsave(); onClose() }}
            className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-left text-[15px] font-semibold text-red-500 hover:bg-red-50">
            🗑 Remove from saved
          </button>
        </div>
      </div>
    </>
  )
}

// ── create collection sheet ───────────────────────────────────────────────────
const EMOJI_OPTIONS = ['🍽️','❤️','👶','⚡','🎉','🌶️','🥗','🍛','🫕','💪','🌙','☀️','🐟','🥩','🫓','🌍','🧑‍🍳','🥘']

function CreateCollectionSheet({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (!name.trim() || loading) return
    setLoading(true)
    try {
      const col = await onCreate(name.trim(), emoji)
      onClose(col)
    } catch (err) {
      setError(err?.message || 'Could not create collection.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={() => onClose(null)} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl px-6 pt-4 pb-10">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-extrabold text-[#1A2E1A] tracking-tight mb-5">New collection</h2>

        {/* Emoji picker */}
        <p className="text-xs font-semibold text-[#9B9490] uppercase tracking-wider mb-2">Choose emoji</p>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" style={{ scrollbarWidth: 'none' }}>
          {EMOJI_OPTIONS.map(e => (
            <button key={e} onClick={() => setEmoji(e)}
              className="shrink-0 w-11 h-11 rounded-xl text-xl flex items-center justify-center transition-all"
              style={{
                background: emoji === e ? '#FEF0E8' : '#F5F0EA',
                border: emoji === e ? '2px solid #E8611A' : '2px solid transparent',
              }}>
              {e}
            </button>
          ))}
        </div>

        {/* Name input */}
        <p className="text-xs font-semibold text-[#9B9490] uppercase tracking-wider mb-2">Collection name</p>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Baby Food, Quick Weekdays…"
          className="w-full border border-[#EDE8E0] rounded-xl px-4 py-3 text-sm text-[#1A2E1A] outline-none mb-2"
          style={{ background: '#FAFAF9' }}
        />
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="mt-3 w-full h-13 rounded-full py-3.5 text-white text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ background: '#C2511A', boxShadow: '0 8px 18px -8px rgba(194,81,26,.7)' }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create collection
        </button>
      </div>
    </>
  )
}

// ── recipe card (inside collection) ──────────────────────────────────────────
function RecipeCard({ recipe, onLongPress, onClick }) {
  const pressTimer = useRef(null)
  const thumb = recipe.thumbnailUrl || null
  const [thumbErr, setThumbErr] = useState(false)

  function startPress() {
    pressTimer.current = setTimeout(() => onLongPress?.(), 500)
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
  }

  return (
    <button
      className="w-full text-left bg-white rounded-2xl overflow-hidden shadow-sm"
      onClick={onClick}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
    >
      {thumb && !thumbErr ? (
        <img
          src={thumb}
          alt={recipe.title}
          className="w-full h-28 object-cover"
          onError={() => setThumbErr(true)}
          onLoad={(e) => { if (e.target.naturalWidth <= 120) setThumbErr(true) }}
        />
      ) : (
        <div className="w-full h-28 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#F3E2C4 0%,#EFD9B2 100%)' }}>
          <span className="text-3xl">🍽️</span>
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-bold text-[#1A2E1A] leading-snug line-clamp-2">{recipe.title}</p>
        {recipe.channelName && (
          <p className="text-xs text-[#9B9490] mt-1 truncate">By {recipe.channelName}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1.5">
            {recipe.totalTimeMinutes && (
              <span className="text-[11px] bg-[#F0EBE4] text-[#6B5B4E] rounded-full px-2 py-0.5">
                {recipe.totalTimeMinutes < 60 ? `${recipe.totalTimeMinutes}m` : `${Math.floor(recipe.totalTimeMinutes/60)}h`}
              </span>
            )}
            {recipe.isVegetarian && (
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-green-600 shrink-0" />
                <span className="text-[11px] font-semibold text-green-700">Veg</span>
              </span>
            )}
          </div>
          {recipe.cookedCount > 0 && (
            <span className="text-[11px] font-semibold rounded-full px-2 py-0.5"
              style={{ background: '#FEF6DC', color: '#B8860B' }}>
              Cooked {recipe.cookedCount}×
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── COLLECTION VIEW ───────────────────────────────────────────────────────────
const FILTERS = ['All', 'Vegetarian', 'Non-veg', 'Under 30 min']

function CollectionView({ collection, allRecipes, onBack, session, onUnsave, cuisineFilter = null }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('All')
  const [actionSheet, setActionSheet] = useState(null)

  const isAll = collection.id === '__all__'
  const recipes = (isAll
    ? allRecipes
    : allRecipes.filter(r => r.collections?.some(c => c.id === collection.id))
  ).filter(r => {
    if (!cuisineFilter) return true
    return (r.cuisineRegion || r.cuisine || '').toLowerCase().includes(cuisineFilter.toLowerCase())
  })

  const filtered = recipes.filter(r => {
    if (filter === 'All') return true
    if (filter === 'Vegetarian') return r.isVegetarian
    if (filter === 'Non-veg') return !r.isVegetarian
    if (filter === 'Under 30 min') return r.totalTimeMinutes && r.totalTimeMinutes < 30
    return true
  })

  async function handleRemoveFromCollection(recipe) {
    if (!session || isAll) return
    try {
      await removeFromCollection(collection.id, recipe.userRecipeId, session.access_token)
    } catch { /* silent */ }
  }

  async function handleUnsave(recipe) {
    if (!session) return
    try {
      await unsaveRecipe(recipe.userRecipeId, session.access_token)
      onUnsave(recipe.userRecipeId)
    } catch { /* silent */ }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="flex items-center px-4 pt-14 pb-3 gap-3">
        <button onClick={onBack}
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"
          style={{ boxShadow: '0 2px 8px -4px rgba(26,46,26,.2)' }}>
          <ArrowLeft size={18} className="text-[#1A2E1A]" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-[17px] font-extrabold text-[#1A2E1A] tracking-tight">
            {cuisineFilter ? cuisineFilter : `${collection.emoji} ${collection.name}`}
          </h1>
          <p className="text-[12px] text-[#9B9490] mt-0.5">
            {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            {cuisineFilter ? ' · tap ← to see all' : ''}
          </p>
        </div>
        {!isAll && (
          <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 2px 8px -4px rgba(26,46,26,.2)' }}>
            <MoreHorizontal size={18} className="text-[#1A2E1A]" />
          </button>
        )}
        {isAll && <div className="w-10 shrink-0" />}
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="shrink-0 px-4 h-8 rounded-full text-[13px] font-semibold transition-colors"
            style={{
              background: filter === f ? '#1A2E1A' : '#fff',
              color: filter === f ? '#fff' : '#6B5B4E',
              border: filter === f ? 'none' : '1px solid rgba(26,46,26,.12)',
            }}>
            {f}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <span className="text-6xl">{collection.emoji || '📂'}</span>
          <p className="text-lg font-bold text-[#1A2E1A]">
            {isAll ? 'Your cookbook is empty' : `${collection.name} is empty`}
          </p>
          <p className="text-sm text-[#9B9490]">
            {isAll ? 'Save recipes from YouTube to build your collection'
                    : 'Go to Discover to add recipes'}
          </p>
          <button onClick={() => navigate('/discover')}
            className="h-12 px-6 rounded-full text-white text-[14px] font-bold"
            style={{ background: '#C2511A' }}>
            Find recipes →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mx-4 mt-4">
          {filtered.map(r => (
            <RecipeCard key={r.userRecipeId || r.recipeId} recipe={r}
              onClick={() => navigate(`/recipe/${r.recipeId}`, { state: { recipe: r } })}
              onLongPress={() => setActionSheet(r)}
            />
          ))}
        </div>
      )}

      {/* FAB */}
      <button onClick={() => navigate('/discover')}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center z-30"
        style={{ background: '#E8611A', boxShadow: '0 8px 20px -6px rgba(232,97,26,.8)' }}>
        <Plus size={24} className="text-white" />
      </button>

      {actionSheet && (
        <ActionSheet
          recipe={actionSheet}
          collectionId={isAll ? null : collection.id}
          collectionName={collection.name}
          onClose={() => setActionSheet(null)}
          onRemoveFromCollection={() => handleRemoveFromCollection(actionSheet)}
          onUnsave={() => handleUnsave(actionSheet)}
        />
      )}
    </div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function SavedRecipes() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession()

  const [allRecipes, setAllRecipes] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCollection, setActiveCollection] = useState(null)
  const [activeCuisine, setActiveCuisine] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // Clear stale data immediately when user switches accounts
  useEffect(() => {
    setAllRecipes([])
    setCollections([])
    setActiveCollection(null)
  }, [session?.user?.id])

  // Open cuisine-filtered view when navigated from Discover cuisine tiles
  useEffect(() => {
    const cuisine = new URLSearchParams(location.search).get('cuisine')
    if (cuisine) {
      setActiveCuisine(cuisine)
      setActiveCollection({ id: '__all__', name: 'All Recipes', emoji: '📚' })
      window.history.replaceState({}, '', '/saved')
    }
  }, [location.search])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    Promise.all([
      getSavedRecipes(session.access_token).catch(() => []),
      getCollections(session.access_token).catch(() => []),
    ]).then(([recipes, cols]) => {
      setAllRecipes(Array.isArray(recipes) ? recipes : [])
      setCollections(Array.isArray(cols) ? cols : [])
    }).finally(() => setLoading(false))
  }, [session])

  function handleUnsave(userRecipeId) {
    setAllRecipes(prev => prev.filter(r => r.userRecipeId !== userRecipeId))
  }

  async function handleCreateCollection(name, emoji) {
    const col = await createCollection(name, emoji, session.access_token)
    setCollections(prev => [{ ...col, recipeCount: 0 }, ...prev])
    return col
  }

  // If inside a collection
  if (activeCollection) {
    return (
      <CollectionView
        collection={activeCollection}
        allRecipes={allRecipes}
        onBack={() => { setActiveCollection(null); setActiveCuisine(null) }}
        session={session}
        onUnsave={handleUnsave}
        cuisineFilter={activeCuisine}
      />
    )
  }

  // ── Auth state ───────────────────────────────────────────────────────────
  if (session === undefined || loading) return <Skeleton />

  if (!session) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] items-center justify-center px-8 text-center pb-24">
        <span className="text-6xl mb-5">📚</span>
        <h2 className="text-xl font-extrabold text-[#1A2E1A] mb-2">Your cookbook is empty</h2>
        <p className="text-sm text-[#9B9490] mb-6">Sign in to save recipes and build your collection</p>
        <button onClick={() => navigate('/auth')}
          className="h-13 px-7 rounded-full text-white font-bold py-3.5"
          style={{ background: '#C2511A' }}>
          Sign in
        </button>
      </div>
    )
  }

  // ── Filtered recipes for search ───────────────────────────────────────────
  const searchResults = query.trim()
    ? allRecipes.filter(r =>
        r.title?.toLowerCase().includes(query.toLowerCase()) ||
        r.channelName?.toLowerCase().includes(query.toLowerCase())
      )
    : null

  // ── Collection grid ───────────────────────────────────────────────────────
  const recipesByCollection = (colId) =>
    allRecipes.filter(r => r.collections?.some(c => c.id === colId))

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3">
        <div>
          <p className="text-[11px] font-bold text-[#E8611A] tracking-[.06em] mb-0.5">
            raso<span className="font-extrabold">IQ</span>
          </p>
          <h1 className="text-2xl font-extrabold text-[#1A2E1A] tracking-tight">My Cookbook</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: '#E8611A' }}>
          <Plus size={20} className="text-white" />
        </button>
      </div>

      {/* Search */}
      <div className="mx-4 mb-4">
        <div className="flex items-center gap-2.5 bg-white rounded-full border border-[#EDE8E0] px-4 h-11"
          style={{ boxShadow: '0 2px 8px -6px rgba(26,46,26,.15)' }}>
          <Search size={16} className="text-[#9B9490] shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search recipes…"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={14} className="text-[#9B9490]" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Search results ── */}
        {searchResults !== null ? (
          <div className="mx-4">
            <p className="text-xs font-semibold text-[#9B9490] mb-3">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-[#9B9490] text-center py-12">No recipes matching "{query}"</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map(r => (
                  <RecipeCard key={r.userRecipeId} recipe={r}
                    onClick={() => navigate(`/recipe/${r.recipeId}`, { state: { recipe: r } })}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (

          /* ── Collections grid ── */
          <div className="mx-4">

            {/* Empty state — no recipes at all */}
            {allRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-6xl mb-4">📚</span>
                <h2 className="text-xl font-extrabold text-[#1A2E1A] mb-2">Your cookbook is empty</h2>
                <p className="text-sm text-[#9B9490] mb-6 max-w-xs">
                  Save recipes from YouTube to build your collection
                </p>
                <button onClick={() => navigate('/discover')}
                  className="h-12 px-6 rounded-full text-white text-[14px] font-bold"
                  style={{ background: '#C2511A' }}>
                  Find recipes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">

                {/* All Recipes — full width */}
                <button
                  onClick={() => setActiveCollection({ id: '__all__', name: 'All Recipes', emoji: '📚' })}
                  className="col-span-2 bg-white rounded-2xl overflow-hidden shadow-sm text-left">
                  <GradientCard emoji="📚" name="All Recipes" height="h-32" index={-1} allRecipes />
                  <div className="p-3">
                    <p className="text-[15px] font-bold text-[#1A2E1A]">📚 All Recipes</p>
                    <p className="text-sm text-[#9B9490] mt-0.5">
                      All {allRecipes.length} recipe{allRecipes.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>

                {/* Collection cards */}
                {collections.map((col, i) => {
                  const colRecipes = recipesByCollection(col.id)
                  return (
                    <button key={col.id}
                      onClick={() => setActiveCollection(col)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm text-left">
                      <GradientCard emoji={col.emoji || '📁'} name={col.name} height="h-40" index={i} />
                      <div className="p-3">
                        <p className="text-sm font-bold text-[#1A2E1A] truncate">
                          {col.emoji || '📁'} {col.name}
                        </p>
                        <p className="text-xs text-[#9B9490] mt-0.5">
                          {colRecipes.length} recipe{colRecipes.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>
                  )
                })}

                {/* New collection card */}
                <button
                  onClick={() => setShowCreate(true)}
                  className="bg-white rounded-2xl h-52 flex flex-col items-center justify-center"
                  style={{ border: '2px dashed #D5CFC8' }}>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                    style={{ background: '#FEF0E8' }}>
                    <Plus size={22} className="text-[#E8611A]" />
                  </div>
                  <p className="text-sm font-semibold text-[#9B9490]">New collection</p>
                </button>

              </div>
            )}
          </div>
        )}
      </div>

      {/* Create collection sheet */}
      {showCreate && (
        <CreateCollectionSheet
          onClose={(col) => {
            setShowCreate(false)
            if (col) setActiveCollection({ ...col, recipeCount: 0 })
          }}
          onCreate={handleCreateCollection}
        />
      )}
    </div>
  )
}
