import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Heart, Play, Clock, Zap, Users, BarChart2, X, ChefHat, Info, Loader2, FolderPlus, Check, Plus } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSession } from '../lib/useSession'
import { getLocalExtractions, FREE_LIMIT } from '../lib/localExtractions'
import { getRecipe, saveRecipe, unsaveRecipe, getCollections, createCollection, addToCollection, removeFromCollection } from '../lib/api'

function formatTime(mins) {
  if (!mins) return '—'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function getYouTubeThumbnail(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (!match) return null
  return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
}

export default function RecipePage() {
  const { state } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(state?.recipe || null)
  const [loadingRecipe, setLoadingRecipe] = useState(!state?.recipe && !!id)
  const [fetchError, setFetchError] = useState(null)
  const [activeTab, setActiveTab] = useState('ingredients')
  const [saved, setSaved] = useState(!!(state?.recipe?.userRecipeId))
  const [userRecipeId, setUserRecipeId] = useState(state?.recipe?.userRecipeId || null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [servings, setServings] = useState(null)
  const [techniqueSheet, setTechniqueSheet] = useState(null)
  const [thumbError, setThumbError] = useState(false)
  const [authSheet, setAuthSheet] = useState(null)
  const [checkedSteps, setCheckedSteps] = useState(new Set())
  const [tooltip, setTooltip] = useState(null)
  const [addColSheet, setAddColSheet] = useState(false)
  const [collections, setCollections] = useState([])
  const [colBusy, setColBusy] = useState(null)
  const [colMemberships, setColMemberships] = useState(new Set())
  const session = useSession()
  const localCount = getLocalExtractions().length

  useEffect(() => {
    if (state?.recipe) {
      setRecipe(state.recipe)
      setServings(state.recipe.servings ?? 4)
      return
    }
    if (!id) { navigate('/'); return }
    setLoadingRecipe(true)
    getRecipe(id)
      .then(r => { setRecipe(r); setServings(r.servings ?? 4) })
      .catch(() => setFetchError('Could not load recipe.'))
      .finally(() => setLoadingRecipe(false))
  }, [id])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setTechniqueSheet(null); setTooltip(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (loadingRecipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC]">
        <Loader2 size={28} className="animate-spin text-[#E8611A]" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#FDF6EC] gap-4 px-8 text-center">
        <p className="text-[#5A6B5A] text-sm">{fetchError}</p>
        <button onClick={() => navigate(-1)} className="text-[#E8611A] font-semibold text-sm">Go back</button>
      </div>
    )
  }

  if (!recipe) return null

  const totalTime = recipe.totalTimeMinutes || ((recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)) || null
  const activeTime = recipe.prepTimeMinutes || null
  const difficulty = recipe.difficulty || 'Medium'
  const originalServings = recipe.servings ?? 4
  const ratio = servings / originalServings
  const thumbnail = getYouTubeThumbnail(recipe.source?.url)

  function scaleQty(qty) {
    if (!qty || isNaN(Number(qty))) return qty
    const scaled = Number(qty) * ratio
    return scaled % 1 === 0 ? scaled : +scaled.toFixed(1)
  }

  function toggleStep(idx) {
    setCheckedSteps(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const tabs = ['ingredients', 'steps', 'techniques']

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] relative">
      {/* Hero */}
      <div className="relative h-[260px] shrink-0 overflow-hidden">
        {thumbnail && !thumbError ? (
          <img src={thumbnail} alt={recipe.title} className="w-full h-full object-cover" onError={() => setThumbError(true)} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8611A] to-[#C2511A]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <div className="flex items-center gap-2 mb-2">
            {recipe.cuisine && (
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">{recipe.cuisine}</span>
            )}
            {recipe.dietaryTags?.includes('vegetarian') && (
              <span className="w-4 h-4 rounded border-2 border-green-400 flex items-center justify-center shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-400" />
              </span>
            )}
          </div>
          <h1 className="font-display text-xl font-bold text-white leading-snug">{recipe.title}</h1>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 border-b border-[#EDE8E0] shrink-0">
        {[
          { icon: Clock, label: 'Total', value: formatTime(totalTime) },
          { icon: Zap, label: 'Active', value: formatTime(activeTime) },
          { icon: Users, label: 'Serves', value: servings ?? '—' },
          { icon: BarChart2, label: 'Level', value: difficulty },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col items-center py-4 border-r border-[#EDE8E0] last:border-r-0">
            <Icon size={15} className="text-[#E8611A] mb-1" />
            <span className="text-[11px] text-[#9B9490] mb-0.5">{label}</span>
            <span className="text-sm font-bold text-[#1A2E1A]">{value}</span>
          </div>
        ))}
      </div>

      {/* Source card */}
      {recipe.source?.channelName && (
        <div className="mx-5 mt-4 flex items-center gap-3 bg-white rounded-2xl px-4 py-3 border border-[#EDE8E0]">
          <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0">
            <Play size={14} className="text-white fill-white ml-0.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#9B9490]">Source</p>
            <p className="text-sm font-semibold text-[#1A2E1A] truncate">{recipe.source.channelName}</p>
          </div>
          {recipe.source.url && (
            <a href={recipe.source.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#E8611A] shrink-0">
              View original
            </a>
          )}
        </div>
      )}

      {/* Guest usage banner */}
      {!session && (
        <div className="mx-5 mt-4 flex items-center justify-between bg-[#FEF0E8] rounded-2xl px-4 py-3">
          <span className="text-xs font-medium text-[#C2511A]">{localCount} of {FREE_LIMIT} free recipes used</span>
          <button onClick={() => navigate('/auth')} className="text-xs font-bold text-[#E8611A]">Sign in for unlimited →</button>
        </div>
      )}

      {/* Tabs */}
      <div className="mx-5 mt-5 flex gap-2 shrink-0">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-[#1A2E1A] text-white' : 'bg-[#EDE8E0] text-[#5A6B5A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 px-5 pt-5 pb-36 overflow-y-auto" onClick={() => setTooltip(null)}>

        {activeTab === 'ingredients' && (
          <div>
            <div className="flex items-center justify-between mb-5 bg-white rounded-2xl border border-[#EDE8E0] px-4 py-3">
              <div>
                <p className="text-xs text-[#9B9490]">Servings</p>
                <p className="text-sm font-semibold text-[#1A2E1A]">{recipe.ingredients?.length ?? 0} ingredients</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setServings(s => Math.max(1, s - 1))}
                  className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center text-[#1A2E1A] text-lg font-semibold leading-none"
                >
                  −
                </button>
                <span className="text-base font-bold text-[#1A2E1A] w-5 text-center">{servings}</span>
                <button
                  onClick={() => setServings(s => s + 1)}
                  className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center text-[#1A2E1A] text-lg font-semibold leading-none"
                >
                  +
                </button>
              </div>
            </div>

            {recipe.ingredientGroups?.length > 0 ? (
              recipe.ingredientGroups.map((group, gi) => (
                <div key={gi} className="mb-5">
                  <p className="text-xs font-bold text-[#9B9490] uppercase tracking-wider mb-3">{group.name}</p>
                  {group.ingredients.map((ing, i) => (
                    <IngredientRow key={i} ing={ing} scaleQty={scaleQty} index={`g${gi}-${i}`} tooltip={tooltip} setTooltip={setTooltip} />
                  ))}
                </div>
              ))
            ) : (
              recipe.ingredients?.map((ing, i) => (
                <IngredientRow key={i} ing={ing} scaleQty={scaleQty} index={i} tooltip={tooltip} setTooltip={setTooltip} />
              ))
            )}
          </div>
        )}

        {activeTab === 'steps' && (
          <div className="flex flex-col gap-6">
            {recipe.steps?.map((step, i) => {
              const done = checkedSteps.has(i)
              return (
                <div key={i} className={`flex gap-4 transition-opacity ${done ? 'opacity-50' : 'opacity-100'}`}>
                  <button
                    onClick={() => toggleStep(i)}
                    className={`shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center mt-0.5 transition-colors ${
                      done ? 'bg-[#2D7A5A] text-white' : 'bg-[#1A2E1A] text-white'
                    }`}
                  >
                    {done ? '✓' : (step.order ?? i + 1)}
                  </button>
                  <div className="flex-1">
                    <p className="text-[14px] text-[#1A2E1A] leading-relaxed">{step.instruction}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {step.durationMinutes && (
                        <span className="text-xs text-[#9B9490] bg-[#F0EBE4] rounded-full px-2.5 py-1">
                          ⏱ {step.durationMinutes} min
                        </span>
                      )}
                      {step.technique && (
                        <div className="flex flex-col items-start gap-0.5">
                          <button
                            onClick={() => setTechniqueSheet(step.technique)}
                            className="text-xs font-semibold text-[#2D7A5A] bg-[#EAF3EC] rounded-full px-2.5 py-1 uppercase tracking-wide"
                          >
                            {step.technique}
                          </button>
                          <button onClick={() => setActiveTab('techniques')} className="text-[10px] text-[#9B9490] pl-1">
                            Tap to learn →
                          </button>
                        </div>
                      )}
                    </div>
                    {step.tip && (
                      <p className="mt-2 text-xs text-[#E8611A] bg-[#E8611A]/8 rounded-xl px-3 py-2">
                        💡 {step.tip}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {activeTab === 'techniques' && (
          <div className="flex flex-col gap-4">
            {recipe.techniques?.length > 0 ? (
              recipe.techniques.map((t, i) => <TechniqueCard key={i} technique={t} />)
            ) : (
              <p className="text-sm text-[#9B9490] text-center py-8">No techniques listed for this recipe.</p>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#FDF6EC]/95 backdrop-blur-sm border-t border-[#EDE8E0] px-5 py-4">
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (session) navigate(`/cook/${recipe.id || recipe.recipeId || 'mode'}`, { state: { recipe } })
              else setAuthSheet('cook')
            }}
            className="flex-1 bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]"
          >
            Start Cooking
          </button>
          <div className="flex flex-col items-center gap-1">
            <button
              disabled={saveLoading}
              onClick={async () => {
                if (!session) { setAuthSheet('save'); return }
                setSaveLoading(true)
                try {
                  if (saved && userRecipeId) {
                    await unsaveRecipe(userRecipeId, session.access_token)
                    setSaved(false)
                    setUserRecipeId(null)
                  } else {
                    const recipeId = recipe.id || recipe.recipeId
                    const result = await saveRecipe(recipeId, session.access_token)
                    setSaved(true)
                    setUserRecipeId(result.userRecipeId)
                  }
                } catch { /* silently ignore duplicate save or network error */ }
                finally { setSaveLoading(false) }
              }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${
                saved && session ? 'bg-[#E8611A] border-[#E8611A]' : 'bg-white border-[#EDE8E0]'
              }`}
            >
              {saveLoading
                ? <Loader2 size={18} className="animate-spin text-[#9B9490]" />
                : <Heart size={20} className={saved && session ? 'text-white fill-white' : 'text-[#9B9490]'} />
              }
            </button>
            {saved && session && (
              <button
                onClick={async () => {
                  if (!collections.length) {
                    const cols = await getCollections(session.access_token).catch(() => [])
                    setCollections(Array.isArray(cols) ? cols : [])
                    const userRecipeId = recipe.userRecipeId
                    if (userRecipeId) setColMemberships(new Set((recipe.collections || []).map(c => c.id)))
                  }
                  setAddColSheet(true)
                }}
                className="text-[10px] text-[#E8611A] font-semibold whitespace-nowrap"
              >
                + Collection
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add to collection sheet */}
      {addColSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setAddColSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
            <div className="w-10 h-1 bg-[#EDE8E0] rounded-full mx-auto mb-5" />
            <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-1">Add to collection</h3>
            <p className="text-sm text-[#9B9490] mb-5 truncate">{recipe.title}</p>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {collections.map(col => {
                const inCol = colMemberships.has(col.id)
                return (
                  <button
                    key={col.id}
                    onClick={async () => {
                      if (colBusy) return
                      const userRecipeId = recipe.userRecipeId
                      if (!userRecipeId) return
                      setColBusy(col.id)
                      try {
                        if (inCol) {
                          await removeFromCollection(col.id, userRecipeId, session.access_token)
                          setColMemberships(prev => { const s = new Set(prev); s.delete(col.id); return s })
                        } else {
                          await addToCollection(col.id, userRecipeId, session.access_token)
                          setColMemberships(prev => new Set([...prev, col.id]))
                        }
                      } catch { /* silent */ }
                      finally { setColBusy(null) }
                    }}
                    className="flex items-center gap-3 bg-[#F7F3EE] rounded-xl px-4 py-3 text-left"
                  >
                    <span className="text-xl shrink-0">{col.emoji || '📁'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2E1A]">{col.name}</p>
                      <p className="text-xs text-[#9B9490]">{col.recipeCount} recipe{col.recipeCount !== 1 ? 's' : ''}</p>
                    </div>
                    {colBusy === col.id
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
              {collections.length === 0 && (
                <p className="text-sm text-[#9B9490] py-4 text-center">No collections yet. Create one below.</p>
              )}
            </div>
            <button
              onClick={() => { /* navigate to saved page to create collection */ navigate('/saved') }}
              className="mt-3 flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-dashed border-[#E8611A] text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#FEF0E8] flex items-center justify-center shrink-0">
                <Plus size={15} className="text-[#E8611A]" />
              </div>
              <span className="text-sm font-semibold text-[#E8611A]">Create new collection</span>
            </button>
          </div>
        </>
      )}

      {/* Auth gate sheet */}
      {authSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setAuthSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="w-10 h-10 rounded-full bg-[#FEF0E8] flex items-center justify-center">
                <ChefHat size={18} className="text-[#E8611A]" />
              </div>
              <button onClick={() => setAuthSheet(null)} className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center">
                <X size={16} className="text-[#5A6B5A]" />
              </button>
            </div>
            <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-2">
              {authSheet === 'cook' ? 'Sign in to access Cook Mode' : 'Sign in to save recipes'}
            </h3>
            <p className="text-sm text-[#5A6B5A] leading-relaxed mb-6">
              {authSheet === 'cook'
                ? 'Cook Mode guides you step-by-step with timers and hands-free mode. Create a free account to unlock it.'
                : 'Save unlimited recipes to your collection and access them anytime.'}
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { localStorage.setItem('pendingRecipe', JSON.stringify(recipe)); navigate('/auth') }} className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]">
                Sign in
              </button>
              <button onClick={() => { localStorage.setItem('pendingRecipe', JSON.stringify(recipe)); navigate('/auth') }} className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]">
                Create free account
              </button>
              <button onClick={() => setAuthSheet(null)} className="text-sm text-[#9B9490] text-center py-1">
                Maybe later
              </button>
            </div>
          </div>
        </>
      )}

      {/* Technique sheet */}
      {techniqueSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setTechniqueSheet(null)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#2D7A5A] uppercase tracking-wider bg-[#EAF3EC] px-3 py-1 rounded-full">Technique</span>
              <button onClick={() => setTechniqueSheet(null)} className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center">
                <X size={16} className="text-[#5A6B5A]" />
              </button>
            </div>
            {(() => {
              const t = recipe.techniques?.find(t =>
                (t.id || t.name || t.title || '')?.toLowerCase() === techniqueSheet?.toLowerCase()
              )
              return (
                <>
                  <h3 className="font-display text-lg font-bold text-[#1A2E1A] mb-3">{t?.displayName || t?.name || techniqueSheet}</h3>
                  <p className="text-sm text-[#5A6B5A] leading-relaxed">{t?.description || 'A key cooking technique used in Indian cuisine.'}</p>
                </>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}

function IngredientRow({ ing, scaleQty, index, tooltip, setTooltip }) {
  const hasInference = !!ing.quantityInferenceNote
  const showTooltip = tooltip === index

  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-[#F0EBE4] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[#1A2E1A]">{ing.name}</p>
        {ing.nameEnglish && ing.nameEnglish !== ing.name && (
          <p className="text-xs text-[#BDB8B0]">{ing.nameEnglish}</p>
        )}
        {ing.preparation && <p className="text-xs text-[#9B9490] mt-0.5">{ing.preparation}</p>}
      </div>
      <div className="text-right shrink-0 relative">
        {(ing.quantity || ing.unit) ? (
          <div className="flex items-center gap-1 justify-end">
            <p className="text-sm font-bold text-[#E8611A]">
              {hasInference ? '~' : ''}{scaleQty(ing.quantity)} {ing.unit}
            </p>
            {hasInference && (
              <button
                onClick={e => { e.stopPropagation(); setTooltip(showTooltip ? null : index) }}
                className="text-[#9B9490] flex items-center"
              >
                <Info size={13} />
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#C0BAB4]">to taste</p>
        )}
        {ing.optional && <p className="text-[11px] text-[#C0BAB4]">optional</p>}
        {showTooltip && hasInference && (
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1A2E1A] text-white text-xs rounded-xl px-3 py-2 z-10 text-left leading-relaxed shadow-lg">
            {ing.quantityInferenceNote}
            <div className="absolute right-3 bottom-[-5px] w-2.5 h-2.5 bg-[#1A2E1A] rotate-45" />
          </div>
        )}
      </div>
    </div>
  )
}

const CATEGORY_STYLES = {
  'foundational':   { bg: '#FEF0E8', text: '#E8611A' },
  'masala':         { bg: '#FEF6E4', text: '#F5A623' },
  'cooking method': { bg: '#EAF3EC', text: '#2D7A5A' },
  'prep technique': { bg: '#F0EBE6', text: '#6B5B4E' },
}

const META_LABELS = {
  heat_level: 'Heat level',
  fat: 'Fat',
  spices_sequence: 'Spice sequence',
  technique_duration: 'Duration',
  pan_type: 'Pan type',
  texture_goal: 'Texture goal',
  common_mistakes: 'Common mistakes',
}

function TechniqueCard({ technique }) {
  const name = technique.displayName || technique.name || technique.title || 'Technique'
  const description = technique.description || technique.explanation || ''
  const category = technique.category || ''
  const steps = technique.foundInSteps
  const style = CATEGORY_STYLES[category.toLowerCase()] || { bg: '#EAF3EC', text: '#2D7A5A' }
  const metaEntries = Object.entries(META_LABELS).filter(([key]) => technique[key] != null)

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E0] p-5">
      {category && (
        <div className="inline-flex items-center px-3 py-1 rounded-full mb-3" style={{ backgroundColor: style.bg }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: style.text }}>{category}</span>
        </div>
      )}
      <h3 className="font-display text-base font-bold text-[#1A2E1A] mb-2">{name}</h3>
      <p className="text-sm text-[#5A6B5A] leading-relaxed">{description}</p>
      {metaEntries.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-[#F0EBE4]">
          {metaEntries.map(([key, label]) => {
            const val = technique[key]
            return (
              <div key={key} className="flex items-start gap-3">
                <span className="text-[11px] font-bold text-[#9B9490] uppercase tracking-wider w-28 shrink-0 pt-0.5">{label}</span>
                <span className="text-xs text-[#5A6B5A] leading-relaxed flex-1">
                  {Array.isArray(val) ? val.join(', ') : String(val)}
                </span>
              </div>
            )
          })}
        </div>
      )}
      {steps?.length > 0 && (
        <p className="text-xs text-[#BDB8B0] mt-3">Found in steps: {steps.join(', ')}</p>
      )}
    </div>
  )
}
