import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Loader2, Share2, Check } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getGroceryList } from '../lib/api'
import { getWeekDates, todayISO } from '../utils/streak'

const CHECK_KEY = 'rasoiq_grocery_checked'

function getChecked() {
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') } catch { return {} }
}
function saveChecked(obj) {
  localStorage.setItem(CHECK_KEY, JSON.stringify(obj))
}

export default function GroceryList() {
  const navigate = useNavigate()
  const session = useSession()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(getChecked)

  const weekDates = getWeekDates()
  const startDate = weekDates[0]
  const endDate = weekDates[6]

  useEffect(() => {
    if (!session) return
    setLoading(true)
    getGroceryList(startDate, endDate, session.access_token)
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [session, startDate, endDate])

  function toggle(key) {
    const next = { ...checked, [key]: !checked[key] }
    setChecked(next)
    saveChecked(next)
  }

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0)
  const checkedCount = groups.reduce((s, g) =>
    s + g.items.filter(i => checked[i.name?.toLowerCase()]).length, 0)

  function handleShare() {
    const text = groups.map(g =>
      `${g.category}:\n` + g.items.map(i => `• ${i.name}${i.quantity ? ` (${i.quantity}${i.unit ? ' ' + i.unit : ''})` : ''}`).join('\n')
    ).join('\n\n')
    if (navigator.share) {
      navigator.share({ title: 'Grocery List – rasoIQ', text })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center">
          <ArrowLeft size={20} className="text-[#1A2E1A]" />
        </button>
        <span className="font-display text-lg font-bold text-[#1A2E1A]">Grocery List</span>
        <button onClick={handleShare} className="w-9 h-9 flex items-center justify-center">
          <Share2 size={18} className="text-[#1A2E1A]" />
        </button>
      </div>

      {/* Week label */}
      <div className="px-5 pb-4">
        <p className="text-xs text-[#9B9490]">
          Week of {new Date(startDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>
        {totalItems > 0 && (
          <p className="text-xs font-semibold text-[#2D7A5A] mt-1">
            {checkedCount} of {totalItems} items checked
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#E8611A]" />
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center py-16 px-8 text-center">
          <ShoppingCart size={40} className="text-[#DDD8D0] mb-4" />
          <p className="font-bold text-[#1A2E1A] mb-1">No items this week</p>
          <p className="text-sm text-[#9B9490]">Plan meals for the week to auto-generate a grocery list.</p>
        </div>
      ) : (
        <div className="px-5 flex flex-col gap-6">
          {groups.map(group => (
            <div key={group.category}>
              <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-wider mb-2">
                {group.category}
              </p>
              <div className="bg-white rounded-2xl border border-[#EDE8E0] divide-y divide-[#F3EDE7]">
                {group.items.map((item, idx) => {
                  const key = item.name?.toLowerCase() || idx
                  const isChecked = !!checked[key]
                  return (
                    <button
                      key={key}
                      onClick={() => toggle(key)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-[#2D7A5A] border-[#2D7A5A]' : 'border-[#DDD8D0]'
                      }`}>
                        {isChecked && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                      <span className={`flex-1 text-sm font-semibold transition-colors ${
                        isChecked ? 'text-[#C0B8AF] line-through' : 'text-[#1A2E1A]'
                      }`}>
                        {item.name}
                      </span>
                      {(item.quantity || item.unit) && (
                        <span className="text-xs text-[#9B9490] shrink-0">
                          {item.quantity && Number.isFinite(item.quantity)
                            ? `${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}${item.unit ? ' ' + item.unit : ''}`
                            : item.unit}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
