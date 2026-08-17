import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getGroceryList } from '../lib/api'
import { getWeekDates } from '../utils/streak'

const CHECK_KEY = 'rasoiq_grocery_checked'

// Per-category accent colors
const CATEGORY_ACCENTS = {
  Produce:          '#2D7A5A',
  Dairy:            '#5B8DEF',
  'Spices & Masala':'#E8611A',
  'Grains & Lentils':'#8A5A2E',
  Pantry:           '#6B5B4E',
  Other:            '#9B9490',
}

function getAccent(name) {
  return CATEGORY_ACCENTS[name] || '#9B9490'
}

function getChecked() {
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') } catch { return {} }
}
function saveChecked(obj) {
  localStorage.setItem(CHECK_KEY, JSON.stringify(obj))
}

export default function GroceryList() {
  const navigate  = useNavigate()
  const session   = useSession()
  const [groups, setGroups]       = useState([])
  const [mealCount, setMealCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [checked, setChecked]     = useState(getChecked)

  const weekDates = getWeekDates()
  const startDate = weekDates[0]
  const endDate   = weekDates[6]

  const weekLabel = `${new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(endDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`

  // Clear stale data immediately when user switches accounts
  useEffect(() => {
    setGroups([])
    setMealCount(0)
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    getGroceryList(startDate, endDate, session.access_token)
      .then(data => {
        setGroups(Array.isArray(data?.categories) ? data.categories : [])
        setMealCount(data?.mealCount ?? 0)
      })
      .catch(() => { setGroups([]); setMealCount(0) })
      .finally(() => setLoading(false))
  }, [session, startDate, endDate])

  function toggle(key) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    saveChecked(next)
  }

  function clearChecked() {
    setChecked({})
    saveChecked({})
  }


  function handleShare() {
    const text = groups.map(g =>
      `${g.category}:\n` + g.items.map(i =>
        `• ${i.name}${i.quantity ? ` – ${i.quantity % 1 === 0 ? i.quantity : i.quantity.toFixed(1)}${i.unit ? ' ' + i.unit : ''}` : ''}`
      ).join('\n')
    ).join('\n\n')
    if (navigator.share) {
      navigator.share({ title: "This Week's Groceries – rasoIQ", text })
    } else {
      navigator.clipboard?.writeText(text)
    }
  }

  const totalItems   = groups.reduce((s, g) => s + g.items.length, 0)
  const checkedCount = groups.reduce((s, g) =>
    s + g.items.filter(i => checked[i.name?.toLowerCase()]).length, 0)
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC]">
        <Header onBack={() => navigate(-1)} onShare={handleShare} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={26} className="animate-spin text-[#E8611A]" />
        </div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC]">
        <Header onBack={() => navigate(-1)} onShare={null} />
        <div className="flex-1 flex flex-col items-center justify-center px-10 text-center">
          <div className="w-[104px] h-[104px] rounded-full flex items-center justify-center mb-[22px]"
            style={{background:'#FCE5C8'}}>
            <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#E8611A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z"/>
              <path d="M9 8V6a3 3 0 0 1 6 0v2"/>
            </svg>
          </div>
          <h2 className="m-0 mb-2 text-[20px] font-extrabold text-[#1A2E1A]">No meals planned this week</h2>
          <p className="m-0 mb-6 text-[14.5px] leading-snug text-[#6B5B4E]">Plan your meals to generate a grocery list</p>
          <button onClick={() => navigate('/')}
            className="h-[52px] px-[26px] rounded-[26px] text-white text-[15.5px] font-bold"
            style={{background:'#C2511A', boxShadow:'0 8px 20px -8px rgba(194,81,26,.75)'}}>
            Plan this week →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC]">
      <Header onBack={() => navigate(-1)} onShare={handleShare} />

      <main className="flex-1 overflow-y-auto px-[22px] pt-2 pb-4">

        {/* Week summary card */}
        <div className="bg-white rounded-[18px] p-4 mb-5" style={{boxShadow:'0 6px 18px -16px rgba(26,46,26,.4)'}}>
          <p className="text-[12.5px] font-medium text-[#6B5B4E]">{weekLabel}</p>
          <p className="mt-[5px] text-[14px] font-semibold text-[#1A2E1A]">
            {mealCount} planned meal{mealCount !== 1 ? 's' : ''} · {totalItems} ingredients
          </p>
          <div className="mt-3 flex items-center justify-between text-[12.5px] font-semibold text-[#6B5B4E]">
            <span>{checkedCount} of {totalItems} checked</span>
            <span>{pct}%</span>
          </div>
          <div className="mt-[7px] h-[7px] rounded-full overflow-hidden" style={{background:'rgba(26,46,26,.08)'}}>
            <div className="h-full rounded-full bg-[#E8611A] transition-all" style={{width:`${pct}%`}} />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-5">
          {groups.map(group => {
            const accent = getAccent(group.category)
            return (
              <div key={group.category}>
                <div className="flex items-center gap-2 mb-[9px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{background: accent}} />
                  <span className="text-[12px] font-bold uppercase tracking-[.06em] text-[#1A2E1A]">
                    {group.category}
                  </span>
                </div>

                <div className="bg-white rounded-[14px] overflow-hidden divide-y divide-[#1A2E1A]/06"
                  style={{boxShadow:'0 4px 14px -12px rgba(26,46,26,.35)'}}>
                  {group.items.map((item, idx) => {
                    const key     = item.name?.toLowerCase() || String(idx)
                    const on      = !!checked[key]
                    const qtyStr  = item.quantity && Number.isFinite(item.quantity)
                      ? `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}${item.unit ? ' ' + item.unit : ''}`
                      : item.unit || ''
                    return (
                      <div key={key} className="flex items-center gap-3 px-[14px] py-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggle(key)}
                          className="w-6 h-6 rounded-[7px] shrink-0 flex items-center justify-center cursor-pointer"
                          style={{
                            border: on ? 'none' : '2px solid rgba(26,46,26,.25)',
                            background: on ? '#2D7A5A' : '#fff',
                          }}>
                          {on && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5"/>
                            </svg>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-bold truncate"
                            style={{color: on ? 'rgba(26,46,26,.4)' : '#1A2E1A', textDecoration: on ? 'line-through' : 'none'}}>
                            {item.name}
                          </p>
                        </div>

                        {qtyStr && (
                          <span className="shrink-0 text-[12.5px] font-medium"
                            style={{color: on ? 'rgba(26,46,26,.35)' : '#6B5B4E', textDecoration: on ? 'line-through' : 'none'}}>
                            {qtyStr}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            )
          })}
        </div>
      </main>

      {/* Bottom bar */}
      <div className="shrink-0 flex items-center gap-2.5 px-[22px] pt-3 pb-[26px] bg-white border-t border-[#1A2E1A]/10">
        <button onClick={handleShare}
          className="flex-1 h-12 rounded-[24px] text-[#C2511A] text-[14.5px] font-bold border-[1.5px] border-[#E8611A] bg-white">
          Share list
        </button>
        <button onClick={clearChecked}
          className="shrink-0 h-12 px-4 text-[14px] font-semibold text-[#6B5B4E] bg-transparent border-none cursor-pointer">
          Clear checked
        </button>
      </div>
    </div>
  )
}

function Header({ onBack, onShare }) {
  return (
    <div className="flex items-center justify-between h-[50px] px-3.5 shrink-0">
      <button onClick={onBack}
        className="w-10 h-10 rounded-[12px] border-none bg-transparent flex items-center justify-center cursor-pointer">
        <span className="inline-block w-[11px] h-[11px] border-l-[2.4px] border-b-[2.4px] border-[#1A2E1A] ml-1 rotate-45" />
      </button>
      <h1 className="m-0 text-[17px] font-extrabold text-[#1A2E1A] tracking-tight">This Week's Groceries</h1>
      {onShare ? (
        <button onClick={onShare}
          className="w-10 h-10 rounded-[12px] border-none bg-transparent flex items-center justify-center cursor-pointer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A2E1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/>
            <path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4"/>
          </svg>
        </button>
      ) : <span className="w-10" />}
    </div>
  )
}
