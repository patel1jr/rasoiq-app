import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, UtensilsCrossed } from 'lucide-react'
import { useSession } from '../lib/useSession'

const API_URL = import.meta.env.VITE_API_URL

async function getMealLog(token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${API_URL}/api/meal-log`, { headers })
  if (!res.ok) throw new Error('Failed to load')
  return res.json()
}

function formatDate(iso) {
  if (!iso) return ''
  const date = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - date) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatMealName(entry) {
  return entry.customName
    || entry.name
    || entry.stapleId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    || entry.recipeTitle
    || 'Meal'
}

const MEAL_TYPE_COLORS = {
  breakfast: { bg: '#FEF6E4', text: '#F5A623' },
  lunch:     { bg: '#EAF3EC', text: '#2D7A5A' },
  dinner:    { bg: '#FEF0E8', text: '#E8611A' },
  snack:     { bg: '#F0EBE6', text: '#6B5B4E' },
}

function MealTypeChip({ type }) {
  const key = (type || '').toLowerCase()
  const style = MEAL_TYPE_COLORS[key] || { bg: '#F0EBE4', text: '#9B9490' }
  return (
    <span
      className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {type || 'Meal'}
    </span>
  )
}

function LogRow({ entry }) {
  const name = formatMealName(entry)
  const date = formatDate(entry.loggedAt || entry.createdAt)
  const servings = entry.servings

  return (
    <div className="bg-white rounded-xl mx-4 mb-2 p-4 border border-[#EDE8E0]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-display text-[15px] font-bold text-[#1A2E1A] leading-snug truncate">{name}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <MealTypeChip type={entry.mealType} />
            {entry.cuisine && (
              <span className="text-[11px] text-[#9B9490]">{entry.cuisine}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-[#9B9490]">{date}</p>
          {servings && (
            <p className="text-[11px] text-[#C0B8AF] mt-0.5">{servings} serving{servings !== 1 ? 's' : ''}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
      <div className="w-16 h-16 rounded-full bg-[#FEF0E8] flex items-center justify-center mb-4">
        <UtensilsCrossed size={28} className="text-[#E8611A]" />
      </div>
      <p className="font-display text-lg font-bold text-[#1A2E1A] mb-1">No meals logged yet</p>
      <p className="text-sm text-[#9B9490] leading-relaxed mb-6">Use Quick Log to track what you cook every day.</p>
      <button
        onClick={() => navigate('/log')}
        className="bg-[#E8611A] text-white font-semibold px-6 py-3 rounded-full text-sm"
      >
        Log a meal
      </button>
    </div>
  )
}

// Group entries by date label
function groupByDate(entries) {
  const groups = {}
  for (const entry of entries) {
    const label = formatDate(entry.loggedAt || entry.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(entry)
  }
  return Object.entries(groups)
}

export default function History() {
  const navigate = useNavigate()
  const session = useSession()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session === undefined) return
    const token = session?.access_token || null
    getMealLog(token)
      .then(data => setEntries(Array.isArray(data) ? data : data.entries || data.logs || []))
      .catch(() => setError('Could not load history.'))
      .finally(() => setLoading(false))
  }, [session])

  const groups = groupByDate(entries)

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Top bar */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="font-display text-xl font-bold text-[#1A2E1A]">Cooking History</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#E8611A]" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <p className="text-sm text-[#9B9490]">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); getMealLog(session?.access_token).then(d => setEntries(Array.isArray(d) ? d : d.entries || d.logs || [])).catch(() => setError('Could not load history.')).finally(() => setLoading(false)) }}
            className="text-sm font-semibold text-[#E8611A]"
          >
            Try again
          </button>
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex-1">
          {groups.map(([dateLabel, items]) => (
            <div key={dateLabel} className="mb-4">
              <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-widest mx-4 mb-2">
                {dateLabel}
              </p>
              {items.map((entry, i) => <LogRow key={entry.id || i} entry={entry} />)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
