import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Heart, Loader2, BookOpen, Plus, Check, FolderPlus, Pencil, Trash2 } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getSavedRecipes, getCollections, createCollection, addToCollection, removeFromCollection, unsaveRecipe } from '../lib/api'

// ─── Helpers ───────────────────────────────────────────────────────────────
function getYouTubeThumbnail(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (!match) return null
  return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
}

const CUISINE_ACCENT = {
  punjabi:        '#E8611A',
  'south indian': '#2D7A5A',
  gujarati:       '#F5A623',
  bengali:        '#F5A623',
  rajasthani:     '#E8611A',
}
function accentColor(c) {
  if (!c) return '#C0B8AF'
  return CUISINE_ACCENT[c.toLowerCase()] || '#C0B8AF'
}

const EMOJI_OPTIONS = ['👶','🍽️','⚡','🎉','❤️','🌶️','🥗','🍛','🫕','💪','🌙','☀️','🧑‍🍳','🥘','🍜']

// ─── Create Collection sheet ───────────────────────────────────────────────
function CreateCollectionSheet({ onClose, onCreated, session }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true); setError(null)
    try {
      const created = await createCollection(name.trim(), emoji, session.access_token)
      onCreated(created)
    } catch (err) {
      console.error('createCollection failed:', err)
      const msg = err?.message || err?.detail || err?.title || ''
      setError(msg || 'Could not create collection.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-5" />
        <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-5">New collection</h3>

        {/* Emoji picker */}
        <p className="text-xs font-semibold text-[#9B9490] mb-2">Choose an emoji</p>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-5">
          {EMOJI_OPTIONS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                emoji === e ? 'ring-2 ring-[#E8611A] bg-[#FEF0E8]' : 'bg-[#F5F0EA]'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Name input */}
        <p className="text-xs font-semibold text-[#9B9490] mb-2">Collection name</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder="e.g. Baby Food, Fine Dining…"
          className="w-full border border-[#EDE8E0] rounded-xl px-4 py-3 text-sm text-[#1A2E1A] placeholder:text-[#C0B8AF] outline-none focus:border-[#E8611A] transition-colors"
        />

        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={!name.trim() || loading}
          className="mt-5 w-full bg-[#E8611A] text-white font-bold py-4 rounded-full text-[15px] flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Create collection
        </button>
      </div>
    </>
  )
}

// ─── Add to Collection sheet ───────────────────────────────────────────────
function AddToCollectionSheet({ recipe, collections, onClose, onCollectionCreated, session }) {
  const [busy, setBusy] = useState(null) // collectionId being toggled
  const [localMemberships, setLocalMemberships] = useState(
    () => new Set((recipe.collections || []).map(c => c.id))
  )
  const [showCreate, setShowCreate] = useState(false)

  async function toggle(col) {
    if (busy) return
    setBusy(col.id)
    const inCol = localMemberships.has(col.id)
    try {
      if (inCol) {
        await removeFromCollection(col.id, recipe.userRecipeId, session.access_token)
        setLocalMemberships(prev => { const s = new Set(prev); s.delete(col.id); return s })
      } else {
        await addToCollection(col.id, recipe.userRecipeId, session.access_token)
        setLocalMemberships(prev => new Set([...prev, col.id]))
      }
    } catch { /* silent — optimistic update already done */ }
    finally { setBusy(null) }
  }

  if (showCreate) {
    return (
      <CreateCollectionSheet
        session={session}
        onClose={() => setShowCreate(false)}
        onCreated={col => { onCollectionCreated(col); setShowCreate(false) }}
      />
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-5" />
        <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-1">Add to collection</h3>
        <p className="text-sm text-[#9B9490] mb-5 truncate">{recipe.title}</p>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
          {collections.map(col => {
            const inCol = localMemberships.has(col.id)
            return (
              <button
                key={col.id}
                onClick={() => toggle(col)}
                className="flex items-center gap-3 bg-[#F7F3EE] rounded-xl px-4 py-3 text-left transition-colors active:bg-[#F0EBE4]"
              >
                <span className="text-xl shrink-0">{col.emoji || '📁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2E1A]">{col.name}</p>
                  <p className="text-xs text-[#9B9490]">{col.recipeCount} recipe{col.recipeCount !== 1 ? 's' : ''}</p>
                </div>
                {busy === col.id
                  ? <Loader2 size={16} className="animate-spin text-[#9B9490] shrink-0" />
                  : inCol
                    ? <div className="w-6 h-6 rounded-full bg-[#E8611A] flex items-center justify-center shrink-0">
                        <Check size={13} className="text-white" strokeWidth={3} />
                      </div>
                    : <div className="w-6 h-6 rounded-full border-2 border-[#EDE8E0] shrink-0" />
                }
              </button>
            )
          })}
        </div>

        {/* New collection row */}
        <button
          onClick={() => setShowCreate(true)}
          className="mt-3 flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-dashed border-[#E8611A] text-left"
        >
          <div className="w-8 h-8 rounded-full bg-[#FEF0E8] flex items-center justify-center shrink-0">
            <Plus size={15} className="text-[#E8611A]" />
          </div>
          <span className="text-sm font-semibold text-[#E8611A]">Create new collection</span>
        </button>
      </div>
    </>
  )
}

// ─── Long-press action sheet ───────────────────────────────────────────────
function CardActionSheet({ recipe, onAddToCollection, onUnsave, onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-4" />
        <p className="text-xs text-[#9B9490] mb-4 truncate">{recipe.title}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onAddToCollection}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl bg-[#F7F3EE] text-left"
          >
            <FolderPlus size={18} className="text-[#2D7A5A]" />
            <span className="text-sm font-semibold text-[#1A2E1A]">Add to collection</span>
          </button>
          <button
            onClick={onUnsave}
            className="flex items-center gap-3 w-full px-4 py-4 rounded-xl bg-[#F7F3EE] text-left"
          >
            <Trash2 size={18} className="text-red-500" />
            <span className="text-sm font-semibold text-red-500">Remove from saved</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-full px-4 py-4 rounded-xl bg-[#F0EBE4]"
          >
            <span className="text-sm font-semibold text-[#9B9490]">Cancel</span>
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Unsave confirm sheet ──────────────────────────────────────────────────
function UnsaveSheet({ recipe, onConfirm, onCancel }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">Remove from saved?</p>
        <p className="text-sm text-[#9B9490] mb-6">"{recipe.title}" will be removed from your saved recipes.</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl text-[15px]">Remove</button>
          <button onClick={onCancel} className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]">Keep saved</button>
        </div>
      </div>
    </>
  )
}

// ─── Recipe card (with long-press) ─────────────────────────────────────────
function RecipeCard({ recipe, onTap, onLongPress, onUnsave }) {
  const [thumbError, setThumbError] = useState(false)
  const thumbnail = getYouTubeThumbnail(recipe.source?.url || recipe.sourceUrl)
  const accent = accentColor(recipe.cuisineRegion || recipe.cuisine)
  const pressTimer = useRef(null)

  function startPress() {
    pressTimer.current = setTimeout(() => onLongPress(recipe), 500)
  }
  function cancelPress() {
    clearTimeout(pressTimer.current)
  }

  const showThumb = thumbnail && !thumbError

  return (
    <button
      onClick={() => onTap(recipe)}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#EDE8E0] text-left w-full active:scale-[0.98] transition-transform"
    >
      {/* Accent bar — thicker + full-bleed when no image */}
      {showThumb ? (
        <div className="relative w-full h-28 overflow-hidden">
          <img
            src={thumbnail}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
          <div className="absolute bottom-0 left-0 right-0 h-8"
            style={{ background: 'linear-gradient(to top, rgba(255,255,255,0.7), transparent)' }} />
        </div>
      ) : (
        <div className="h-1.5 w-full" style={{ backgroundColor: accent }} />
      )}

      <div className="p-3">
        {/* Cuisine dot + region when no image */}
        {!showThumb && (recipe.cuisineRegion || recipe.cuisine) && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />
            <p className="text-[10px] font-semibold text-[#9B9490] uppercase tracking-wide truncate">
              {recipe.cuisineRegion || recipe.cuisine}
            </p>
          </div>
        )}
        <p
          className="font-display text-sm font-bold text-[#1A2E1A] leading-snug"
          style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {recipe.title}
        </p>
        {(recipe.source?.channelName || recipe.channelName) && (
          <p className="text-[11px] text-[#9B9490] mt-0.5 truncate">
            {recipe.source?.channelName || recipe.channelName}
          </p>
        )}
        {/* Collection badges */}
        {recipe.collections?.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {recipe.collections.slice(0, 2).map(c => (
              <span key={c.id} className="text-[10px] bg-[#F0EBE4] text-[#9B9490] px-2 py-0.5 rounded-full">
                {c.emoji} {c.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-end mt-2">
          <button
            onClick={e => { e.stopPropagation(); onUnsave(recipe) }}
            onMouseDown={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            className="p-1 -m-1"
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
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function SavedRecipes() {
  const navigate = useNavigate()
  const session = useSession()

  const [recipes, setRecipes]       = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [activeCol, setActiveCol]   = useState(null) // null = All
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery]           = useState('')

  // sheets
  const [createSheet, setCreateSheet]         = useState(false)
  const [addColTarget, setAddColTarget]       = useState(null) // recipe for add-to-collection
  const [actionTarget, setActionTarget]       = useState(null) // recipe for long-press menu
  const [unsaveTarget, setUnsaveTarget]       = useState(null)

  function loadAll(token) {
    setLoading(true)
    setError(null)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 15000)
    )
    Promise.race([
      Promise.all([
        getSavedRecipes(token).catch(() => []),
        getCollections(token).catch(() => []),
      ]),
      timeout,
    ]).then(([r, c]) => {
      setRecipes(Array.isArray(r) ? r : r?.recipes || [])
      setCollections(Array.isArray(c) ? c : [])
    }).catch(() => {
      setError('Could not load your recipes. Pull to refresh.')
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    if (session) {
      loadAll(session.access_token)
    } else if (session === undefined) {
      // Still loading auth — show skeleton briefly
      setLoading(true)
    }
    // session === null handled by guest wall below
  }, [session])

  const visibleRecipes = useMemo(() => {
    let list = recipes
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r => r.title?.toLowerCase().includes(q))
    }
    if (activeCol) {
      list = list.filter(r => r.collections?.some(c => c.id === activeCol.id))
    }
    return list
  }, [recipes, activeCol, query])

  function openRecipe(recipe) {
    const id = recipe.id || recipe.recipeId
    navigate(id ? `/recipe/${id}` : '/recipe', { state: { recipe } })
  }

  async function confirmUnsave() {
    const userRecipeId = unsaveTarget.userRecipeId || unsaveTarget.id
    // Optimistic remove
    setRecipes(prev => prev.filter(r => (r.userRecipeId || r.id) !== userRecipeId))
    setUnsaveTarget(null)
    if (userRecipeId && session) {
      try { await unsaveRecipe(userRecipeId, session.access_token) }
      catch { /* already removed from UI; silently ignore */ }
    }
  }

  function handleCollectionCreated(col) {
    setCollections(prev => [{ ...col, recipeCount: 0 }, ...prev])
    setActiveCol(col)
    setCreateSheet(false)
  }

  function handleColCreatedFromAddSheet(col) {
    setCollections(prev => [{ ...col, recipeCount: 0 }, ...prev])
  }

  // ── Guest wall ──────────────────────────────────────────────────────────
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
          <button onClick={() => navigate('/auth')} className="bg-[#E8611A] text-white font-semibold px-8 py-3 rounded-full text-sm">
            Sign in
          </button>
          <button onClick={() => navigate('/auth')} className="mt-3 text-sm text-[#9B9490] underline underline-offset-2">
            Create free account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Top bar */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between gap-3">
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
            <button onClick={() => { setSearchOpen(false); setQuery('') }}>
              <X size={16} className="text-[#9B9490]" />
            </button>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl font-bold text-[#1A2E1A] flex-1">My Recipes</h1>
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center shrink-0"
            >
              <Search size={17} className="text-[#5A6B5A]" />
            </button>
            <button
              onClick={() => setCreateSheet(true)}
              className="flex items-center gap-1.5 bg-[#E8611A] text-white text-xs font-bold px-3 py-2 rounded-full shrink-0"
            >
              <Plus size={13} />
              New
            </button>
          </>
        )}
      </div>

      {/* Collection tabs */}
      <div className="flex gap-2 overflow-x-auto px-5 mt-3 pb-1 no-scrollbar shrink-0">
        {/* All Recipes tab */}
        <button
          onClick={() => setActiveCol(null)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            !activeCol ? 'bg-[#E8611A] text-white border-[#E8611A]' : 'bg-white text-[#9B9490] border-[#EDE8E0]'
          }`}
        >
          All Recipes
        </button>
        {collections.map(col => (
          <button
            key={col.id}
            onClick={() => setActiveCol(col)}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
              activeCol?.id === col.id ? 'bg-[#E8611A] text-white border-[#E8611A]' : 'bg-white text-[#9B9490] border-[#EDE8E0]'
            }`}
          >
            {col.emoji && <span>{col.emoji}</span>}
            {col.name}
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeCol?.id === col.id ? 'bg-white/25 text-white' : 'bg-[#F0EBE4] text-[#9B9490]'
            }`}>
              {col.recipeCount}
            </span>
          </button>
        ))}
      </div>

      {/* Collection edit bar */}
      {activeCol && (
        <div className="flex items-center justify-between px-5 mt-2">
          <p className="text-xs text-[#9B9490]">
            {activeCol.emoji} {activeCol.name}
          </p>
          <button
            onClick={() => {/* future: edit/delete sheet */}}
            className="flex items-center gap-1 text-xs text-[#9B9490]"
          >
            <Pencil size={11} />
            Edit
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mx-5 mt-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-3">
          <p className="text-sm text-[#9B9490]">{error}</p>
          <button onClick={() => loadAll(session.access_token)} className="text-[#E8611A] font-semibold text-sm">Try again</button>
        </div>
      ) : visibleRecipes.length === 0 ? (
        activeCol ? (
          /* Collection empty state */
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <p className="text-4xl mb-3">{activeCol.emoji || '📁'}</p>
            <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">{activeCol.name}</p>
            <p className="text-sm text-[#9B9490] mb-1">No recipes in this collection yet</p>
            <p className="text-xs text-[#9B9490] mb-6">Browse your saved recipes and add them here</p>
            <button
              onClick={() => setActiveCol(null)}
              className="bg-[#E8611A] text-white font-semibold px-6 py-3 rounded-full text-sm"
            >
              Browse saved recipes
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-[#E8611A]" />
            </div>
            <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">
              {query ? 'No matches' : 'No saved recipes yet'}
            </p>
            <p className="text-sm text-[#9B9490] leading-relaxed mb-6">
              {query ? 'Try a different search term.' : 'Extract recipes from YouTube videos and save them here.'}
            </p>
            {!query && (
              <button onClick={() => navigate('/')} className="bg-[#E8611A] text-white font-semibold px-6 py-3 rounded-full text-sm">
                Extract a recipe
              </button>
            )}
          </div>
        )
      ) : (
        <>
          <p className="text-xs text-[#9B9490] font-medium mx-5 mt-4 mb-1">
            {visibleRecipes.length} recipe{visibleRecipes.length !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 gap-3 mx-5">
            {visibleRecipes.map((r, i) => (
              <RecipeCard
                key={r.id || r.recipeId || r.userRecipeId || i}
                recipe={r}
                onTap={openRecipe}
                onLongPress={r => setActionTarget(r)}
                onUnsave={r => setUnsaveTarget(r)}
              />
            ))}
          </div>
        </>
      )}

      {/* Sheets */}
      {createSheet && (
        <CreateCollectionSheet
          session={session}
          onClose={() => setCreateSheet(false)}
          onCreated={handleCollectionCreated}
        />
      )}

      {addColTarget && (
        <AddToCollectionSheet
          recipe={addColTarget}
          collections={collections}
          session={session}
          onClose={() => setAddColTarget(null)}
          onCollectionCreated={handleColCreatedFromAddSheet}
        />
      )}

      {actionTarget && (
        <CardActionSheet
          recipe={actionTarget}
          onAddToCollection={() => { setAddColTarget(actionTarget); setActionTarget(null) }}
          onUnsave={() => { setUnsaveTarget(actionTarget); setActionTarget(null) }}
          onClose={() => setActionTarget(null)}
        />
      )}

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
