import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, Flame, X } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '../lib/useSession'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getGreeting(hour) {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getMealContext(hour) {
  if (hour < 10) return 'Breakfast time'
  if (hour < 12) return 'Brunch time'
  if (hour < 15) return 'Lunch time'
  if (hour < 18) return 'Snack time'
  return 'Dinner time'
}

const QUICK_PICKS = [
  { id: 1, title: 'Dal Makhani', time: '45m', veg: true, accent: '#C2511A' },
  { id: 2, title: 'Butter Chicken', time: '1h', veg: false, accent: '#E8A87C' },
  { id: 3, title: 'Palak Paneer', time: '35m', veg: true, accent: '#3A7D44' },
  { id: 4, title: 'Chole Bhature', time: '1h 20m', veg: true, accent: '#C8A96E' },
  { id: 5, title: 'Biryani', time: '1h 30m', veg: false, accent: '#7B5EA7' },
]

const PANTRY = [
  'Atta', 'Basmati Rice', 'Chana Dal', 'Ghee', 'Jeera', 'Mustard Seeds',
  'Turmeric', 'Red Chilli', 'Coriander Powder', 'Garam Masala',
]

// lunch and dinner per weekday (0=Sun … 6=Sat)
const WEEK_MEALS = {
  0: { l: null, d: null },
  1: { l: 'Dal Tadka', d: 'Roti' },
  2: { l: 'Rajma Rice', d: null },
  3: { l: null, d: null },
  4: { l: 'Aloo Gobi', d: 'Dal Fry' },
  5: { l: null, d: null },
  6: { l: null, d: null },
}

export default function HomePage() {
  const navigate = useNavigate()
  const session = useSession()
  const [showSuggestSheet, setShowSuggestSheet] = useState(false)
  const now = new Date()
  const hour = now.getHours()
  const today = now.getDay()
  const dateStr = `${DAYS[today]}, ${now.getDate()} ${MONTHS[now.getMonth()]}`

  // Show today + next 2 days (3 total), using local timezone
  const upcomingDays = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    return {
      date: d,
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getDay()],
      dayNum: d.getDate(),
      isToday: i === 0,
      meals: WEEK_MEALS[d.getDay()] || { l: null, d: null },
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#9B9490] mb-0.5">{dateStr}</p>
          <h1 className="font-display text-2xl font-bold text-[#1A2E1A]">
            {session
              ? `${getGreeting(hour)}, ${session.user.user_metadata?.full_name?.split(' ')[0] || 'there'}`
              : getGreeting(hour)
            }
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-[#E8611A]/10 px-3 py-1.5 rounded-full mt-1">
          <Flame size={12} className="text-[#E8611A]" />
          <span className="text-xs font-semibold text-[#E8611A]">{getMealContext(hour)}</span>
        </div>
      </div>

      {/* Hero CTA card */}
      <div className="mx-5 mt-4 rounded-3xl overflow-hidden bg-gradient-to-br from-[#E8611A] to-[#C2511A] p-6">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-2">Today's suggestion</p>
        <h2 className="font-display text-xl font-bold text-white leading-snug mb-5">
          What should I cook{'\n'}for dinner tonight?
        </h2>
        <button
          onClick={() => setShowSuggestSheet(true)}
          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-full flex items-center gap-2"
        >
          Suggest meals
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Quick picks — compact horizontal rows */}
      <div className="mt-7">
        <div className="px-5 flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1A2E1A]">Quick picks</h2>
          <button className="text-xs font-semibold text-[#E8611A]">See all</button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto px-5 pb-1 no-scrollbar">
          {QUICK_PICKS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate('/extract')}
              className="shrink-0 flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-3.5 py-3"
            >
              {/* Color accent dot */}
              <div
                className="w-8 h-8 rounded-xl shrink-0"
                style={{ backgroundColor: item.accent + '33' }}
              >
                <div className="w-full h-full rounded-xl flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.accent }} />
                </div>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-semibold text-[#1A2E1A] whitespace-nowrap">{item.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-[#9B9490]" />
                  <span className="text-[11px] text-[#9B9490]">{item.time}</span>
                  <span className={`w-2.5 h-2.5 rounded border flex items-center justify-center ${
                    item.veg ? 'border-green-500' : 'border-red-500'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${item.veg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Week plan — only for signed-in users */}
      {session && <div className="mx-5 mt-7">
        <h2 className="text-base font-bold text-[#1A2E1A] mb-3">Upcoming meals</h2>
        <div className="flex flex-col gap-2">
          {upcomingDays.map(({ dayName, dayNum, isToday, meals }) => (
            <div
              key={dayNum}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                isToday ? 'bg-[#E8611A]' : 'bg-white border border-[#EDE8E0]'
              }`}
            >
              {/* Day label */}
              <div className="shrink-0 w-10 text-center">
                <p className={`text-[10px] font-bold uppercase ${isToday ? 'text-white/70' : 'text-[#9B9490]'}`}>{dayName}</p>
                <p className={`text-base font-bold leading-tight ${isToday ? 'text-white' : 'text-[#1A2E1A]'}`}>{dayNum}</p>
              </div>

              {/* Divider */}
              <div className={`w-px self-stretch ${isToday ? 'bg-white/20' : 'bg-[#EDE8E0]'}`} />

              {/* L + D */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold shrink-0 w-3 ${isToday ? 'text-white/60' : 'text-[#C0B8AF]'}`}>L</span>
                  <span className={`text-xs font-medium truncate ${
                    meals.l ? (isToday ? 'text-white' : 'text-[#E8611A]') : (isToday ? 'text-white/30' : 'text-[#D0C8C0]')
                  }`}>
                    {meals.l || 'Not planned'}
                  </span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-bold shrink-0 w-3 ${isToday ? 'text-white/60' : 'text-[#C0B8AF]'}`}>D</span>
                  <span className={`text-xs font-medium truncate ${
                    meals.d ? (isToday ? 'text-white' : 'text-[#2D7A5A]') : (isToday ? 'text-white/30' : 'text-[#D0C8C0]')
                  }`}>
                    {meals.d || 'Not planned'}
                  </span>
                </div>
              </div>

              {/* Add button for empty days */}
              {!meals.l && !meals.d && (
                <button className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${
                  isToday ? 'bg-white/20 text-white' : 'bg-[#F5F0EA] text-[#9B9490]'
                }`}>
                  + Add
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => navigate('/meal-plan')}
            className="flex items-center justify-center gap-1.5 w-full py-3 rounded-2xl bg-white border border-[#EDE8E0] text-sm font-semibold text-[#5A6B5A]"
          >
            View full week
            <ChevronRight size={15} />
          </button>
        </div>
      </div>}

      {/* Pantry — only for signed-in users */}
      {session && <div className="mx-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[#1A2E1A]">Your pantry</h2>
          <button className="text-xs font-semibold text-[#E8611A]">Edit</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {PANTRY.map(item => (
            <span
              key={item}
              className="bg-[#EAF3EC] text-[#2D7A5A] text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              {item}
            </span>
          ))}
          <span className="bg-[#F5F0EA] text-[#9B9490] text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-[#D0C8C0]">
            + Add
          </span>
        </div>
      </div>}

      {/* Sign-in nudge for guests */}
      {!session && (
        <div className="mx-5 mt-7 bg-white border border-[#EDE8E0] rounded-3xl p-5 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-[#1A2E1A] mb-0.5">Save recipes & plan meals</p>
            <p className="text-xs text-[#9B9490]">Create a free account to unlock all features.</p>
          </div>
          <button
            onClick={() => navigate('/auth')}
            className="shrink-0 bg-[#E8611A] text-white text-xs font-bold px-4 py-2.5 rounded-xl"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Suggest meals sheet */}
      {showSuggestSheet && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowSuggestSheet(false)} />
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-12">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-bold text-[#E8611A] uppercase tracking-wider bg-[#FEF0E8] px-3 py-1 rounded-full">Coming soon</span>
              <button onClick={() => setShowSuggestSheet(false)} className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center">
                <X size={16} className="text-[#5A6B5A]" />
              </button>
            </div>
            <h3 className="font-display text-xl font-bold text-[#1A2E1A] mb-2">AI Meal Suggestions</h3>
            <p className="text-sm text-[#5A6B5A] leading-relaxed mb-6">
              rasoIQ will suggest meals based on your pantry, preferences, and time of day. This feature is on the way.
            </p>
            <button
              onClick={() => { setShowSuggestSheet(false); navigate('/extract') }}
              className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px]"
            >
              Extract from YouTube instead
            </button>
          </div>
        </>
      )}
    </div>
  )
}
