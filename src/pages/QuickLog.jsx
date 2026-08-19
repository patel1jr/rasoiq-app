import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, X, Check, ChevronDown, Loader2, Clock, Edit3 } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { logMeal } from '../lib/api'

// ─── Staples data ──────────────────────────────────────────────────────────
const STAPLES = [
  {
    category: 'Dal & Lentils',
    items: ['Dal Roti', 'Dal Tadka', 'Rajma Chawal', 'Chana Dal', 'Moong Dal', 'Dal Makhani', 'Panchmel Dal', 'Masoor Dal', 'Toor Dal Chawal'],
  },
  {
    category: 'Sabzi',
    items: ['Aloo Sabzi', 'Aloo Gobi', 'Bhindi', 'Palak Paneer', 'Matar Paneer', 'Baingan Bharta', 'Aloo Methi', 'Lauki Sabzi', 'Tinda Masala', 'Karela'],
  },
  {
    category: 'Rice & Biryani',
    items: ['Jeera Rice', 'Plain Chawal', 'Vegetable Pulao', 'Khichdi', 'Curd Rice', 'Peas Pulao', 'Lemon Rice', 'Biryani'],
  },
  {
    category: 'Bread',
    items: ['Roti', 'Paratha', 'Puri', 'Thepla', 'Makki Ki Roti', 'Bajra Roti', 'Missi Roti', 'Stuffed Paratha'],
  },
  {
    category: 'Chicken & Meat',
    items: ['Chicken Curry', 'Butter Chicken', 'Egg Curry', 'Chicken Biryani', 'Mutton Curry', 'Keema', 'Chicken Kadai', 'Chicken Korma'],
  },
  {
    category: 'Breakfast',
    items: ['Poha', 'Upma', 'Idli Sambar', 'Dosa', 'Aloo Paratha', 'Besan Chilla', 'Sabudana Khichdi', 'Rava Idli'],
  },
  {
    category: 'Snacks & Light',
    items: ['Samosa', 'Pakora', 'Chaat', 'Pav Bhaji', 'Chole Bhature', 'Dabeli', 'Vada Pav'],
  },
]

const ALL_ITEMS = STAPLES.flatMap(c => c.items.map(name => ({ name, category: c.category })))

// ─── localStorage for recent logs ─────────────────────────────────────────
const RECENT_KEY = 'rasoiq_recent_logs'

function getRecentLogs() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] }
}
function saveRecentLog(entry) {
  const list = getRecentLogs().filter(e => e.name !== entry.name)
  list.unshift(entry)
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)))
}

// ─── Helpers ───────────────────────────────────────────────────────────────
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snack', 'Dinner']
const SERVINGS = [1, 2, 3, 4, 5, 6]

function todayLabel() {
  return new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ─── Log confirm sheet ─────────────────────────────────────────────────────
function LogSheet({ mealName, onClose, onLogged, session }) {
  const [mealType, setMealType] = useState(defaultMealType())
  const [servings, setServings] = useState(2)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  function defaultMealType() {
    const h = new Date().getHours()
    if (h < 10) return 'Breakfast'
    if (h < 15) return 'Lunch'
    if (h < 18) return 'Snack'
    return 'Dinner'
  }

  async function handleLog() {
    setLoading(true)
    setError(null)
    const entry = {
      mealType: mealType.toLowerCase(),
      sourceType: 'manual',
      name: mealName,
      servings,
      loggedAt: new Date().toISOString(),
    }
    try {
      if (session) {
        await logMeal(entry, session.access_token)
      }
      saveRecentLog({ name: mealName, mealType: mealType.toLowerCase(), loggedAt: entry.loggedAt })
      setDone(true)
      setTimeout(() => { onLogged(); }, 1200)
    } catch {
      setError('Could not save. Tap to try again.')
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={!loading ? onClose : undefined} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-[#EDE8E0] mx-auto mb-4" />

        {done ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <div className="w-14 h-14 rounded-full bg-[#2D7A5A] flex items-center justify-center">
              <Check size={26} className="text-white" strokeWidth={2.5} />
            </div>
            <p className="font-display text-lg font-bold text-[#1A2E1A]">Logged!</p>
            <p className="text-sm text-[#9B9490]">{mealName} added to your history</p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-bold text-[#9B9490] uppercase tracking-widest mb-1">Logging meal</p>
            <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-5">{mealName}</h3>

            {/* Date row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#9B9490]">Date</span>
              <span className="text-sm font-semibold text-[#1A2E1A]">{todayLabel()}</span>
            </div>

            {/* Meal type */}
            <div className="mb-4">
              <p className="text-sm text-[#9B9490] mb-2">Meal</p>
              <div className="flex gap-2 flex-wrap">
                {MEAL_TYPES.map(t => (
                  <button
                    key={t}
                    onClick={() => setMealType(t)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                      mealType === t
                        ? 'bg-[#E8611A] text-white border-[#E8611A]'
                        : 'bg-white text-[#9B9490] border-[#EDE8E0]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings */}
            <div className="mb-6">
              <p className="text-sm text-[#9B9490] mb-2">Servings</p>
              <div className="flex gap-2">
                {SERVINGS.map(s => (
                  <button
                    key={s}
                    onClick={() => setServings(s)}
                    className={`w-10 h-10 rounded-full text-sm font-bold border transition-colors ${
                      servings === s
                        ? 'bg-[#1A2E1A] text-white border-[#1A2E1A]'
                        : 'bg-white text-[#9B9490] border-[#EDE8E0]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-500 mb-3 text-center">{error}</p>
            )}

            <button
              onClick={handleLog}
              disabled={loading}
              className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={17} className="animate-spin" />}
              Log meal
            </button>

            {!session && (
              <p className="text-[11px] text-[#9B9490] text-center mt-3">
                Saved locally — sign in to sync across devices
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}

// ─── Meal chip ─────────────────────────────────────────────────────────────
function MealChip({ name, onTap }) {
  return (
    <button
      onClick={() => onTap(name)}
      className="shrink-0 bg-white border border-[#EDE8E0] text-[#1A2E1A] text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap active:bg-[#FEF0E8] active:border-[#E8611A] transition-colors"
    >
      {name}
    </button>
  )
}

// ─── Staples tab ───────────────────────────────────────────────────────────
function StaplesTab({ onSelect }) {
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return ALL_ITEMS.filter(i => i.name.toLowerCase().includes(q))
  }, [query])

  return (
    <div>
      {/* Search bar */}
      <div className="mx-5 mt-3">
        <div className={`flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 ${query ? 'border-[#E8611A]' : 'border-[#EDE8E0]'}`}>
          <Search size={16} className="text-[#C0B8AF] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search meals…"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={15} className="text-[#9B9490]" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 pb-4">
        {searchResults ? (
          /* Search results */
          searchResults.length > 0 ? (
            <div className="px-5 flex flex-wrap gap-2">
              {searchResults.map(item => (
                <MealChip key={item.name} name={item.name} onTap={onSelect} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 gap-2">
              <p className="text-sm text-[#9B9490]">No matches for "{query}"</p>
              <button
                onClick={() => onSelect(query.trim())}
                className="text-sm font-semibold text-[#E8611A]"
              >
                Log "{query.trim()}" anyway →
              </button>
            </div>
          )
        ) : (
          /* Category sections */
          STAPLES.map(section => (
            <div key={section.category} className="mb-5">
              <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-widest mx-5 mb-2">
                {section.category}
              </p>
              <div className="flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar">
                {section.items.map(name => (
                  <MealChip key={name} name={name} onTap={onSelect} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Recent tab ────────────────────────────────────────────────────────────
function RecentTab({ onSelect }) {
  const logs = getRecentLogs()

  if (!logs.length) {
    return (
      <div className="flex flex-col items-center py-16 px-8 text-center gap-2">
        <Clock size={32} className="text-[#D0C8C0]" />
        <p className="text-sm font-semibold text-[#1A2E1A]">No recent logs yet</p>
        <p className="text-xs text-[#9B9490]">Meals you log will appear here for quick re-logging.</p>
      </div>
    )
  }

  return (
    <div className="px-5 mt-4 flex flex-col gap-2 pb-4">
      {logs.map((log, i) => {
        const date = new Date(log.loggedAt)
        const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        return (
          <button
            key={i}
            onClick={() => onSelect(log.name)}
            className="flex items-center justify-between bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5 text-left"
          >
            <div>
              <p className="text-sm font-semibold text-[#1A2E1A]">{log.name}</p>
              <p className="text-xs text-[#9B9490] mt-0.5 capitalize">{log.mealType} · {label}</p>
            </div>
            <span className="text-xs font-semibold text-[#E8611A] bg-[#FEF0E8] px-3 py-1.5 rounded-full">
              Log again
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ─── Custom tab ────────────────────────────────────────────────────────────
function CustomTab({ onSelect }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (trimmed) onSelect(trimmed)
  }

  return (
    <div className="px-5 mt-6">
      <p className="text-sm text-[#9B9490] mb-3 leading-relaxed">
        Type any meal name — home food, restaurant, anything.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5 focus-within:border-[#E8611A] transition-colors">
          <Edit3 size={16} className="text-[#C0B8AF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Mom's aloo sabzi"
            className="flex-1 text-sm bg-transparent outline-none text-[#1A2E1A] placeholder:text-[#C0B8AF]"
          />
          {name && (
            <button type="button" onClick={() => setName('')}>
              <X size={15} className="text-[#9B9490]" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-4 w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px] disabled:opacity-40 transition-opacity"
        >
          Continue
        </button>
      </form>

      {/* Quick suggestions */}
      <div className="mt-8">
        <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-widest mb-3">
          Quick ideas
        </p>
        <div className="flex flex-wrap gap-2">
          {['Mom\'s Dal', 'Dadi ke Paratha', 'Street Chole', 'Tadka Chawal', 'Lassi', 'Raita'].map(s => (
            <button
              key={s}
              onClick={() => setName(s)}
              className="bg-white border border-[#EDE8E0] text-[#5A6B5A] text-xs font-medium px-3 py-1.5 rounded-full"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────
const TABS = ['Staples', 'Recent', 'Custom']

export default function QuickLog() {
  const navigate = useNavigate()
  const session = useSession()

  const [activeTab, setActiveTab] = useState('Staples')
  const [sheet, setSheet] = useState(null) // meal name string

  function handleSelect(name) {
    setSheet(name)
  }

  function handleLogged() {
    // Close the sheet and stay on the log page so user can log another meal
    setSheet(null)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-28">

      {/* Top bar */}
      <div className="flex items-center px-5 pt-14 pb-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} className="text-[#5A6B5A]" />
        </button>
        <h1 className="flex-1 text-center font-display text-xl font-bold text-[#1A2E1A]">
          Log a meal
        </h1>
        <div className="w-9 shrink-0" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mx-5 mt-3 bg-[#EDE8E0] p-1 rounded-2xl">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab
                ? 'bg-[#1A2E1A] text-white shadow-sm'
                : 'text-[#9B9490]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'Staples' && <StaplesTab onSelect={handleSelect} />}
        {activeTab === 'Recent'  && <RecentTab  onSelect={handleSelect} />}
        {activeTab === 'Custom'  && <CustomTab  onSelect={handleSelect} />}
      </div>

      {/* Log confirm sheet */}
      {sheet && (
        <LogSheet
          mealName={sheet}
          session={session}
          onClose={() => setSheet(null)}
          onLogged={handleLogged}
        />
      )}
    </div>
  )
}
