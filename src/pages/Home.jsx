import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Plus, Loader2, Play } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getWeekMealPlan, getSavedRecipes } from '../lib/api'
import { getWeekDates, todayISO } from '../utils/streak'
import { getLocalExtractions } from '../lib/localExtractions'
import WeekStrip from '../components/WeekStrip'
import MealPlanSheet from '../components/MealPlanSheet'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// Popular starter recipes — real YouTube videos from popular Indian channels
const POPULAR_RECIPES = [
  {
    title: 'Dal Makhani',
    channel: 'Hebbars Kitchen',
    url: 'https://www.youtube.com/watch?v=QgFCY84K5BI',
    videoId: 'QgFCY84K5BI',
  },
  {
    title: 'Butter Chicken',
    channel: 'Ranveer Brar',
    url: 'https://www.youtube.com/watch?v=a03U45jFxOI',
    videoId: 'a03U45jFxOI',
  },
  {
    title: 'Palak Paneer',
    channel: "Kabita's Kitchen",
    url: 'https://www.youtube.com/watch?v=rHpWMJxcEe4',
    videoId: 'rHpWMJxcEe4',
  },
  {
    title: 'Hyderabadi Biryani',
    channel: 'Turban Tadka',
    url: 'https://www.youtube.com/watch?v=R-QGBpuuRWc',
    videoId: 'R-QGBpuuRWc',
  },
  {
    title: 'Chole Bhature',
    channel: 'Nisha Madhulika',
    url: 'https://www.youtube.com/watch?v=OTU0TpX_8QA',
    videoId: 'OTU0TpX_8QA',
  },
]

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: '🎥',
    title: 'Paste a YouTube link',
    desc: 'Extract any cooking video into a structured recipe instantly',
  },
  {
    step: 2,
    icon: '📖',
    title: 'Save to your cookbook',
    desc: 'Organise recipes into collections you can plan from',
  },
  {
    step: 3,
    icon: '🍳',
    title: 'Cook with guidance',
    desc: 'Step-by-step cook mode with technique coaching',
  },
]

// YouTube thumbnail with gradient fallback
function RecipeThumbnail({ videoId, title }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="w-full h-24 flex items-center justify-center"
        style={{ background: 'repeating-linear-gradient(135deg,#F3E2C4 0 11px,#EFD9B2 11px 22px)' }}>
        <span className="text-2xl">🍽️</span>
      </div>
    )
  }
  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={title}
      className="w-full h-24 object-cover"
      onError={() => setFailed(true)}
    />
  )
}

// ── New-user onboarding sections ─────────────────────────────────────────────
function NewUserSections({ onPopularTap, onLogTap }) {
  return (
    <div className="flex flex-col">

      {/* 1 — GET STARTED CARD */}
      <div className="mx-4 mt-5 rounded-2xl p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#F5A623 0%,#E8611A 60%,#C2511A 100%)', boxShadow: '0 12px 28px -14px rgba(194,81,26,.7)' }}>

        {/* decorative circles */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,.1)' }} />
        <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full pointer-events-none"
          style={{ background: 'rgba(255,255,255,.07)' }} />

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-lg font-bold leading-snug tracking-tight">
              Start your cooking journey
            </p>
            <p className="mt-1 text-sm font-medium leading-snug"
              style={{ color: 'rgba(255,255,255,.9)' }}>
              Extract a recipe from YouTube to build your cookbook
            </p>
            <button
              onClick={() => onPopularTap(null)}
              className="mt-3 flex items-center gap-2 bg-white rounded-full px-4 py-2 text-[13px] font-bold"
              style={{ color: '#C2511A' }}>
              <Play size={13} fill="#C2511A" stroke="none" />
              Extract your first recipe
            </button>
          </div>

          {/* Phone + play illustration */}
          <div className="shrink-0 w-16 flex items-center justify-center pt-1">
            <svg width="52" height="64" viewBox="0 0 52 64" fill="none" aria-hidden="true">
              {/* phone body */}
              <rect x="4" y="1" width="44" height="62" rx="8" stroke="rgba(255,255,255,.55)" strokeWidth="2"/>
              {/* screen */}
              <rect x="8" y="10" width="36" height="38" rx="4" fill="rgba(255,255,255,.12)" stroke="rgba(255,255,255,.3)" strokeWidth="1.5"/>
              {/* play button */}
              <circle cx="26" cy="29" r="11" fill="rgba(255,255,255,.2)" stroke="rgba(255,255,255,.5)" strokeWidth="1.5"/>
              <path d="M23 25l9 4.5-9 4.5V25z" fill="rgba(255,255,255,.85)"/>
              {/* home indicator */}
              <rect x="20" y="56" width="12" height="3" rx="1.5" fill="rgba(255,255,255,.4)"/>
              {/* speaker dots */}
              <circle cx="26" cy="6" r="1.5" fill="rgba(255,255,255,.35)"/>
            </svg>
          </div>
        </div>
      </div>

      {/* 2 — POPULAR RECIPES */}
      <div className="mt-5">
        <p className="mx-4 mb-3 text-[11px] font-bold uppercase tracking-[.08em] text-[#9B9490]">
          Popular to get you started
        </p>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: 'none' }}>
          {POPULAR_RECIPES.map(r => (
            <button
              key={r.videoId}
              onClick={() => onPopularTap(r.url)}
              className="shrink-0 w-40 bg-white rounded-2xl overflow-hidden text-left"
              style={{ boxShadow: '0 4px 16px -10px rgba(26,46,26,.35)' }}>
              <RecipeThumbnail videoId={r.videoId} title={r.title} />
              <div className="p-2 pb-3">
                <p className="text-[13px] font-bold text-[#1A2E1A] leading-snug line-clamp-2">
                  {r.title}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-[#E8611A]">Tap to extract</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3 — QUICK LOG PROMPT */}
      <button
        onClick={onLogTap}
        className="mx-4 mt-4 bg-white rounded-2xl p-4 flex items-center gap-3 text-left w-[calc(100%-2rem)]"
        style={{ boxShadow: '0 4px 16px -12px rgba(26,46,26,.3)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-xl"
          style={{ background: '#F0EBE4' }}>
          📝
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1A2E1A]">What did you cook today?</p>
          <p className="text-xs text-[#9B9490] mt-0.5">Log a quick meal to start your history</p>
        </div>
        <ChevronRight size={16} className="text-[#C0B8AF] shrink-0" />
      </button>

      {/* 4 — HOW IT WORKS */}
      <div className="mt-5 mb-2">
        <p className="mx-4 mb-3 text-[11px] font-bold uppercase tracking-[.08em] text-[#9B9490]">
          How rasoIQ works
        </p>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1"
          style={{ scrollbarWidth: 'none' }}>
          {HOW_IT_WORKS.map(s => (
            <div key={s.step}
              className="shrink-0 w-48 bg-white rounded-2xl p-4"
              style={{ boxShadow: '0 4px 16px -12px rgba(26,46,26,.3)' }}>
              <div className="w-8 h-8 rounded-full bg-[#E8611A] flex items-center justify-center">
                <span className="text-white text-[13px] font-bold">{s.step}</span>
              </div>
              <div className="mt-2 text-2xl">{s.icon}</div>
              <p className="mt-2 text-sm font-bold text-[#1A2E1A] leading-snug">{s.title}</p>
              <p className="mt-1 text-xs text-[#9B9490] leading-snug">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate()
  const session = useSession()

  const [weekPlan, setWeekPlan] = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [planLoading, setPlanLoading] = useState(false)
  const [planSheet, setPlanSheet] = useState(null)

  const weekDates = getWeekDates()
  const today = todayISO()
  const startDate = weekDates[0]
  const endDate = weekDates[6]

  // Clear stale data immediately when user switches accounts
  useEffect(() => {
    setWeekPlan([])
    setSavedRecipes([])
  }, [session?.user?.id])

  useEffect(() => {
    if (!session) return
    setPlanLoading(true)
    const timeout = new Promise(resolve => setTimeout(() => resolve([[], []]), 10000))
    Promise.race([
      Promise.all([
        getWeekMealPlan(startDate, endDate, session.access_token).catch(() => []),
        getSavedRecipes(session.access_token).catch(() => []),
      ]),
      timeout,
    ]).then(([plan, recipes]) => {
      setWeekPlan(Array.isArray(plan) ? plan : [])
      setSavedRecipes(Array.isArray(recipes) ? recipes : [])
    }).finally(() => setPlanLoading(false))
  }, [session, startDate, endDate])

  const todayPlan = weekPlan.filter(p => p.plannedDate === today)
  const mealPlanDates = [...new Set(weekPlan.map(p => p.plannedDate))]

  const localExtractions = getLocalExtractions()
  const isUnauthNew = !session && localExtractions.length === 0

  const firstName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    || session?.user?.email?.split('@')[0]
    || 'there'
  const avatarInitial = session
    ? (session.user.user_metadata?.full_name?.[0] || session.user.email?.[0] || '?').toUpperCase()
    : null

  function handlePlanAdded(entry) {
    setWeekPlan(prev => {
      const filtered = prev.filter(p => !(p.plannedDate === entry.plannedDate && p.mealType === entry.mealType))
      return [...filtered, entry]
    })
  }

  function handlePlanRemoved(id) {
    setWeekPlan(prev => prev.filter(p => p.id !== id))
  }

  // Popular recipe tap — navigate to Discover with URL pre-filled
  function handlePopularTap(url) {
    navigate('/discover', { state: url ? { prefillUrl: url } : undefined })
  }

  // ── Unauthenticated new visitor ──────────────────────────────────────────
  if (isUnauthNew) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
        <div className="flex items-center justify-between px-[22px] pt-14 pb-2">
          <div style={{ font: '400 20px Inter', color: '#1A2E1A' }}>
            rasoi<span style={{ fontWeight: 800, color: '#E8611A' }}>IQ</span>
          </div>
          <button onClick={() => navigate('/auth')} className="text-sm font-semibold text-[#E8611A]">
            Sign in
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pb-4">
          {/* Onboarding banner */}
          <div className="mx-[22px] mt-4 rounded-[20px] p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(140deg,#F5A623 0%,#E8611A 65%,#CE4E13 100%)', boxShadow: '0 14px 28px -16px rgba(206,78,19,.8)' }}>
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,.12)' }} />
            <span className="text-[22px]">✨</span>
            <h2 className="mt-2.5 mb-1 text-white text-[20px] font-extrabold tracking-tight leading-tight">
              Welcome to rasoIQ!
            </h2>
            <p className="mb-4 text-[14px] font-medium" style={{ color: 'rgba(255,255,255,.92)' }}>
              Extract recipes from any Indian cooking video
            </p>
            <div className="flex justify-end">
              <button onClick={() => navigate('/auth')}
                className="h-10 px-4 rounded-[20px] bg-white text-[#C2511A] text-[13.5px] font-bold">
                Get started →
              </button>
            </div>
          </div>

          <NewUserSections onPopularTap={handlePopularTap} onLogTap={() => navigate('/log')} />
        </div>
      </div>
    )
  }

  // ── Signed-in state ──────────────────────────────────────────────────────
  const hasTodayPlan = todayPlan.length > 0
  const weekPlanCount = mealPlanDates.length
  const hasMealPlanThisWeek = weekPlanCount > 0
  const isNewSignedInUser = !planLoading && savedRecipes.length === 0 && weekPlan.length === 0

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">

      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-3 pb-0">
        <h1 className="m-0 text-[20px] font-extrabold text-[#1A2E1A] tracking-tight">
          {greeting()}, {firstName} 👋
        </h1>
        <div className="flex items-center gap-2.5">
          <button className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center"
            style={{ boxShadow: '0 2px 8px -4px rgba(26,46,26,.25)' }}>
            <Bell size={17} strokeWidth={2} className="text-[#1A2E1A]" />
          </button>
          <button onClick={() => navigate('/profile')}
            className="w-[38px] h-[38px] rounded-full bg-[#F5A623] flex items-center justify-center">
            <span className="text-white text-[14px] font-bold">{avatarInitial}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-0 pt-[14px] pb-4">

        {/* Today's meal plan card */}
        <div className="mx-[22px] rounded-[20px] p-4"
          style={{
            background: hasTodayPlan ? '#FCF0E5' : '#fff',
            border: hasTodayPlan ? '1px solid rgba(232,97,26,.25)' : '1px solid rgba(26,46,26,.06)',
            boxShadow: '0 8px 20px -16px rgba(26,46,26,.3)',
          }}>
          <p className="text-[11px] font-bold uppercase tracking-[.07em] text-[#6B5B4E]">
            {hasTodayPlan
              ? `Today — ${new Date(today + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`
              : 'Today'}
          </p>

          {planLoading ? (
            <div className="flex justify-center py-3">
              <Loader2 size={18} className="animate-spin text-[#E8611A]" />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {[
                { mt: 'breakfast', letter: 'B' },
                { mt: 'lunch',     letter: 'L' },
                { mt: 'snack',     letter: 'S' },
                { mt: 'dinner',    letter: 'D' },
              ].map(({ mt, letter }) => {
                const entry = todayPlan.find(p => p.mealType === mt)
                // Hide unplanned breakfast and snack rows to keep the card compact;
                // always show lunch and dinner so the user can plan them.
                if (!entry && (mt === 'breakfast' || mt === 'snack')) return null
                return (
                  <div key={mt} className="flex items-center gap-3">
                    <span className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center text-[11px] font-extrabold text-[#1A2E1A] shrink-0"
                      style={{ background: 'rgba(26,46,26,.06)' }}>
                      {letter}
                    </span>
                    {entry ? (
                      entry.recipeId ? (
                        <button
                          onClick={() => navigate(`/recipe/${entry.recipeId}`)}
                          className="flex-1 flex items-center gap-1 text-left min-w-0">
                          <span className="flex-1 text-[15px] font-bold truncate" style={{ color: '#C2511A' }}>
                            {entry.title}
                          </span>
                          <ChevronRight size={14} className="text-[#6B5B4E] shrink-0" />
                        </button>
                      ) : (
                        <span className="flex-1 text-[15px] font-bold text-[#1A2E1A] truncate">
                          {entry.title}
                        </span>
                      )
                    ) : (
                      <>
                        <span className="flex-1 text-[15px] font-medium" style={{ color: 'rgba(26,46,26,.4)' }}>
                          Not planned yet
                        </span>
                        <button
                          onClick={() => setPlanSheet({ date: today, mealType: mt.charAt(0).toUpperCase() + mt.slice(1) })}
                          className="h-8 px-3 rounded-2xl bg-[#E8611A] text-white text-[12px] font-bold shrink-0">
                          + Plan {mt}
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {hasTodayPlan && (() => {
            const hour = new Date().getHours()
            const preferred = hour < 11
              ? ['breakfast', 'lunch', 'snack', 'dinner']
              : hour < 15
              ? ['lunch', 'snack', 'dinner', 'breakfast']
              : hour < 18
              ? ['snack', 'dinner', 'lunch', 'breakfast']
              : ['dinner', 'snack', 'lunch', 'breakfast']
            const cookable = preferred
              .map(mt => todayPlan.find(p => p.mealType === mt && p.recipeId))
              .find(Boolean)
            return (
              <button
                onClick={() => cookable
                  ? navigate(`/cook/${cookable.recipeId}`)
                  : navigate('/saved')
                }
                className="mt-[14px] w-full h-[46px] rounded-[23px] text-white text-[15px] font-bold"
                style={{ background: '#C2511A', boxShadow: '0 8px 18px -8px rgba(194,81,26,.7)' }}>
                Start cooking →
              </button>
            )
          })()}
        </div>

        {/* Quick picks — only shown when user has saved recipes */}
        {savedRecipes.length > 0 && (
          <section className="mt-[22px]">
            <div className="flex items-baseline justify-between px-[22px] pb-3">
              <h2 className="m-0 text-[17px] font-bold text-[#1A2E1A] tracking-tight">
                {hasTodayPlan ? 'For tonight' : 'Ready to cook'}
              </h2>
              <button onClick={() => navigate('/saved')} className="text-[13px] font-semibold text-[#E8611A]">
                See all
              </button>
            </div>
            <div className="flex flex-col gap-2.5 px-[22px]">
              {savedRecipes.slice(0, 3).map(r => (
                <button key={r.recipeId}
                  onClick={() => navigate(`/recipe/${r.recipeId}`, { state: { recipe: r } })}
                  className="w-full text-left bg-white rounded-[14px] px-[14px] py-[13px] flex items-center gap-3"
                  style={{ boxShadow: '0 6px 16px -14px rgba(26,46,26,.4)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold text-[#1A2E1A]">{r.title}</p>
                    {r.channelName && (
                      <p className="mt-0.5 text-[11.5px] font-medium text-[#6B5B4E]">By {r.channelName}</p>
                    )}
                  </div>
                  {r.cuisineRegion && (
                    <span className="shrink-0 rounded-[6px] px-[7px] py-[3px] text-[11px] font-semibold text-[#1A2E1A]"
                      style={{ background: 'rgba(26,46,26,.06)' }}>
                      {r.cuisineRegion}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Weekly calendar strip */}
        <div className="mx-[22px] mt-[22px] bg-white rounded-[18px] p-4"
          style={{ boxShadow: '0 6px 18px -16px rgba(26,46,26,.35)' }}>
          <WeekStrip
            weekDates={weekDates}
            mealPlanDates={mealPlanDates}
            cookedDates={[]}
            today={today}
            onDayClick={(date) => setPlanSheet({ date, mealType: 'Dinner' })}
            summary={weekPlanCount > 0
              ? `${weekPlanCount} meal${weekPlanCount > 1 ? 's' : ''} planned this week`
              : 'No meals planned yet'}
          />
        </div>

        {/* ── NEW SIGNED-IN USER: onboarding sections ── */}
        {isNewSignedInUser && (
          <NewUserSections onPopularTap={handlePopularTap} onLogTap={() => navigate('/log')} />
        )}

        {/* Grocery reminder — only when there are plans */}
        {hasMealPlanThisWeek && (
          <button onClick={() => navigate('/grocery')}
            className="mx-[22px] mt-[18px] flex items-center gap-3 rounded-[16px] px-[15px] py-[14px] border w-[calc(100%-44px)]"
            style={{ background: '#FCF0DC', borderColor: 'rgba(184,121,10,.25)' }}>
            <span className="text-[22px] shrink-0">🛒</span>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[14.5px] font-bold text-[#1A2E1A]">Your weekly grocery list</p>
              <p className="mt-0.5 text-[12.5px] font-medium text-[#6B5B4E]">{weekPlanCount} recipes this week</p>
            </div>
            <span className="text-[13px] font-bold text-[#B8790A] shrink-0 whitespace-nowrap">View list →</span>
          </button>
        )}

      </main>

      {planSheet && (
        <MealPlanSheet
          date={planSheet.date}
          defaultMealType={planSheet.mealType}
          onClose={() => setPlanSheet(null)}
          onAdded={handlePlanAdded}
          onRemoved={handlePlanRemoved}
          existingPlans={weekPlan.filter(p => p.plannedDate === planSheet.date)}
        />
      )}
    </div>
  )
}
