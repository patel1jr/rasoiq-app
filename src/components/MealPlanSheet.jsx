import { useState, useEffect } from 'react'
import { X, Search, Clock, Loader2, ChefHat } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getSavedRecipes, addToMealPlan } from '../lib/api'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

const QUICK_MEALS = {
  Staples: ['Dal Chawal', 'Roti Sabzi', 'Khichdi', 'Poha', 'Upma'],
  Rice: ['Biryani', 'Pulao', 'Curd Rice', 'Lemon Rice', 'Fried Rice'],
  Breads: ['Paratha', 'Puri Bhaji', 'Thepla', 'Dosa', 'Idli Sambar'],
  Snacks: ['Chaat', 'Pakoda', 'Sandwich', 'Maggi', 'Sprouts'],
}

export default function MealPlanSheet({ date, defaultMealType, onClose, onAdded }) {
  const session = useSession()
  const [tab, setTab] = useState('my') // 'my' | 'quick'
  const [mealType, setMealType] = useState(defaultMealType || 'Dinner')
  const [savedRecipes, setSavedRecipes] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null) // { title, recipeId?, customName? }
  const [saving, setSaving] = useState(false)
  const [customText, setCustomText] = useState('')

  useEffect(() => {
    if (!session || tab !== 'my') return
    setLoading(true)
    getSavedRecipes(session.access_token)
      .then(data => setSavedRecipes(Array.isArray(data) ? data : []))
      .catch(() => setSavedRecipes([]))
      .finally(() => setLoading(false))
  }, [session, tab])

  const filtered = savedRecipes.filter(r =>
    !query || r.title?.toLowerCase().includes(query.toLowerCase())
  )

  async function handleAdd() {
    if (!session || !selected) return
    setSaving(true)
    try {
      const payload = {
        plannedDate: date,
        mealType: mealType.toLowerCase(),
        sourceType: selected.recipeId ? 'recipe' : 'custom',
        recipeId: selected.recipeId || null,
        customName: selected.recipeId ? null : selected.title,
      }
      const entry = await addToMealPlan(payload, session.access_token)
      onAdded?.({ ...entry, title: selected.title, mealType: mealType.toLowerCase() })
      onClose()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }

  const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short'
  })

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed left-0 right-0 bottom-0 top-16 max-w-md mx-auto z-50 bg-[#FDF6EC] rounded-t-3xl flex flex-col shadow-xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#1A2E1A]/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <h2 className="text-[17px] font-extrabold text-[#1A2E1A] tracking-tight">
            Plan {dateLabel}
          </h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#1A2E1A]/06 flex items-center justify-center">
            <X size={15} className="text-[#1A2E1A]" strokeWidth={2.6} />
          </button>
        </div>

        {/* Meal type pills */}
        <div className="flex gap-2 px-5 pb-3 shrink-0 overflow-x-auto">
          {MEAL_TYPES.map(mt => (
            <button
              key={mt}
              onClick={() => setMealType(mt)}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                mealType === mt
                  ? 'bg-[#1A2E1A] text-white'
                  : 'bg-[#1A2E1A]/08 text-[#1A2E1A]'
              }`}
            >
              {mt}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-5 border-b border-[#1A2E1A]/10 shrink-0">
          {[['my', 'My Recipes'], ['quick', 'Quick Meal']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`pb-3 text-[13px] font-bold transition-colors ${
                tab === id
                  ? 'text-[#E8611A] border-b-2 border-[#E8611A]'
                  : 'text-[#9B9490]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'my' ? (
            <>
              <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 h-11 mb-3">
                <Search size={16} className="text-[#9B9490] shrink-0" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search your saved recipes…"
                  className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={20} className="animate-spin text-[#E8611A]" />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-[#9B9490] py-10">
                  {savedRecipes.length === 0 ? 'No saved recipes yet.' : 'No matches.'}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {filtered.map(r => {
                    const rid = r.recipeId || r.id
                    const isSelected = selected?.recipeId === rid
                    return (
                      <button
                        key={rid}
                        onClick={() => setSelected(isSelected ? null : { title: r.title, recipeId: rid })}
                        className={`flex items-center gap-3 bg-white rounded-2xl p-3 text-left transition-all ${
                          isSelected ? 'ring-2 ring-[#E8611A]' : 'border border-[#EDE8E0]'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-xl bg-[#F3E2C4] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-[#1A2E1A] truncate">{r.title}</p>
                          {r.channelName && (
                            <p className="text-[11px] text-[#9B9490] mt-0.5">By {r.channelName}</p>
                          )}
                          {r.cuisineRegion && (
                            <span className="inline-block mt-1.5 bg-[#1A2E1A]/06 rounded-md px-2 py-0.5 text-[10px] font-semibold text-[#1A2E1A]">
                              {r.cuisineRegion}
                            </span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                          isSelected ? 'bg-[#E8611A] border-[#E8611A]' : 'border-[#DDD8D0]'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-5">
              {Object.entries(QUICK_MEALS).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-wider mb-2">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => {
                      const isSelected = selected?.title === item && !selected.recipeId
                      return (
                        <button
                          key={item}
                          onClick={() => setSelected(isSelected ? null : { title: item })}
                          className={`px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-[#E8611A] text-white'
                              : 'bg-white border border-[#EDE8E0] text-[#1A2E1A]'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-2">
                <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-wider mb-2">Custom</p>
                <div className="flex gap-2">
                  <input
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Type a meal name…"
                    className="flex-1 bg-white border border-[#EDE8E0] rounded-xl px-4 py-3 text-sm text-[#1A2E1A] placeholder:text-[#C0B8AF] outline-none"
                  />
                  <button
                    onClick={() => { if (customText.trim()) setSelected({ title: customText.trim() }) }}
                    className="bg-[#1A2E1A]/08 text-[#1A2E1A] text-sm font-semibold px-4 rounded-xl"
                  >
                    Use
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation bar */}
        {selected && (
          <div className="shrink-0 px-5 py-4 border-t border-[#1A2E1A]/10 bg-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[15px] font-extrabold text-[#1A2E1A] truncate max-w-[200px]">{selected.title}</p>
                <p className="text-[12px] text-[#9B9490] mt-0.5">{dateLabel} · {mealType}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-full bg-[#1A2E1A]/06 flex items-center justify-center"
              >
                <X size={13} className="text-[#1A2E1A]" strokeWidth={2.6} />
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full h-12 rounded-3xl bg-[#C2511A] text-white font-bold text-[15px] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              Add to plan
            </button>
          </div>
        )}
      </div>
    </>
  )
}
