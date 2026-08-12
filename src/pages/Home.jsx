import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Plus, Loader2 } from 'lucide-react'
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

const PROMPT_CARDS = [
  { icon: '🎥', title: 'Import your first recipe', desc: 'Paste any Indian cooking video link to extract a full recipe', action: 'Extract recipe →', route: '/discover' },
  { icon: '📅', title: 'Plan your first meal', desc: 'What are you cooking this week?', action: '+ Plan a meal', route: null },
  { icon: '🥘', title: 'Browse your saved recipes', desc: 'Add recipes to collections and meal plans', action: 'Go to Saved →', route: '/saved' },
]

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

  useEffect(() => {
    if (!session) return
    setPlanLoading(true)
    Promise.all([
      getWeekMealPlan(startDate, endDate, session.access_token).catch(() => []),
      getSavedRecipes(session.access_token).catch(() => []),
    ]).then(([plan, recipes]) => {
      setWeekPlan(Array.isArray(plan) ? plan : [])
      setSavedRecipes(Array.isArray(recipes) ? recipes : [])
    }).finally(() => setPlanLoading(false))
  }, [session, startDate, endDate])

  const todayPlan = weekPlan.filter(p => p.plannedDate === today)
  const mealPlanDates = [...new Set(weekPlan.map(p => p.plannedDate))]

  const localExtractions = getLocalExtractions()
  const isNew = !session && localExtractions.length === 0

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

  // ---- NEW USER (not signed in, no extractions) ----
  if (isNew) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
        <div className="flex items-center justify-between px-[22px] pt-14 pb-2">
          <div style={{font:'400 20px Inter', color:'#1A2E1A'}}>
            rasoi<span style={{fontWeight:800,color:'#E8611A'}}>IQ</span>
          </div>
          <button onClick={() => navigate('/auth')} className="text-sm font-semibold text-[#E8611A]">Sign in</button>
        </div>

        <div className="overflow-y-auto flex-1 px-0 pb-4">
          {/* Onboarding banner */}
          <div className="mx-[22px] mt-4 rounded-[20px] p-5 relative overflow-hidden"
            style={{background:'linear-gradient(140deg,#F5A623 0%,#E8611A 65%,#CE4E13 100%)',boxShadow:'0 14px 28px -16px rgba(206,78,19,.8)'}}>
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full" style={{background:'rgba(255,255,255,.12)'}} />
            <span className="text-[22px]">✨</span>
            <h2 className="mt-2.5 mb-1 text-white text-[20px] font-extrabold tracking-tight leading-tight">
              Welcome to rasoIQ!
            </h2>
            <p className="mb-4 text-[14px] font-medium" style={{color:'rgba(255,255,255,.92)'}}>
              Let's set up your cooking profile
            </p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="w-2 h-2 rounded-full" style={{background:'rgba(255,255,255,.4)'}} />
                <span className="w-2 h-2 rounded-full" style={{background:'rgba(255,255,255,.4)'}} />
              </div>
              <button onClick={() => navigate('/auth')}
                className="h-10 px-4 rounded-[20px] bg-white text-[#C2511A] text-[13.5px] font-bold">
                Get started →
              </button>
            </div>
          </div>

          {/* Prompt cards */}
          <div className="flex flex-col gap-3 mx-[22px] mt-[18px]">
            {PROMPT_CARDS.map(pc => (
              <div key={pc.title} className="bg-white rounded-[18px] p-4 flex gap-3 items-start"
                style={{boxShadow:'0 6px 18px -16px rgba(26,46,26,.4)'}}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[19px]"
                  style={{background:'#FCE5C8'}}>
                  {pc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-[#1A2E1A]">{pc.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[#6B5B4E]">{pc.desc}</p>
                  <button
                    onClick={() => pc.route ? navigate(pc.route) : setPlanSheet({ date: today, mealType: 'Dinner' })}
                    className="mt-2 text-[13.5px] font-bold text-[#E8611A] bg-transparent border-none p-0">
                    {pc.action}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {planSheet && (
          <MealPlanSheet date={planSheet.date} defaultMealType={planSheet.mealType}
            onClose={() => setPlanSheet(null)} onAdded={handlePlanAdded} />
        )}
      </div>
    )
  }

  // ---- SIGNED IN (returning / active) ----
  const hasTodayPlan = todayPlan.length > 0
  const weekPlanCount = mealPlanDates.length
  const hasMealPlanThisWeek = weekPlanCount > 0

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-3 pb-0">
        <div className="flex items-center gap-[9px]">
          <h1 className="m-0 text-[20px] font-extrabold text-[#1A2E1A] tracking-tight">
            {greeting()}, {firstName} 👋
          </h1>
          {/* streak badge — show if >0 */}
        </div>
        <div className="flex items-center gap-2.5">
          <button className="w-[38px] h-[38px] rounded-full bg-white flex items-center justify-center"
            style={{boxShadow:'0 2px 8px -4px rgba(26,46,26,.25)'}}>
            <Bell size={17} strokeWidth={2} className="text-[#1A2E1A]" />
          </button>
          <button onClick={() => navigate('/profile')}
            className="w-[38px] h-[38px] rounded-full bg-[#F5A623] flex items-center justify-center">
            <span className="text-white text-[14px] font-bold">{avatarInitial}</span>
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-0 pt-[14px] pb-4 flex flex-col gap-0">

        {/* Meal plan card */}
        <div className="mx-[22px] rounded-[20px] p-4"
          style={{
            background: hasTodayPlan ? '#FCF0E5' : '#fff',
            border: hasTodayPlan ? '1px solid rgba(232,97,26,.25)' : '1px solid rgba(26,46,26,.06)',
            boxShadow: '0 8px 20px -16px rgba(26,46,26,.3)'
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
              {['lunch', 'dinner'].map(mt => {
                const entry = todayPlan.find(p => p.mealType === mt)
                const letter = mt === 'lunch' ? 'L' : 'D'
                return (
                  <div key={mt} className="flex items-center gap-3">
                    <span className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center text-[11px] font-extrabold text-[#1A2E1A] shrink-0"
                      style={{background:'rgba(26,46,26,.06)'}}>
                      {letter}
                    </span>
                    {entry ? (
                      <>
                        <span className="flex-1 text-[15px] flex items-center gap-1.5"
                          style={{font: entry.recipeId ? '700 15px Inter' : '600 15px Inter',
                            color: entry.recipeId ? '#C2511A' : '#1A2E1A'}}>
                          {entry.title}
                        </span>
                        {entry.recipeId
                          ? <ChevronRight size={14} className="text-[#6B5B4E] shrink-0" />
                          : null}
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-[15px] font-medium" style={{color:'rgba(26,46,26,.4)'}}>
                          Not planned yet
                        </span>
                        <button onClick={() => setPlanSheet({ date: today, mealType: mt === 'lunch' ? 'Lunch' : 'Dinner' })}
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

          {hasTodayPlan && (
            <button onClick={() => navigate('/discover')}
              className="mt-[14px] w-full h-[46px] rounded-[23px] text-white text-[15px] font-bold"
              style={{background:'#C2511A', boxShadow:'0 8px 18px -8px rgba(194,81,26,.7)'}}>
              Start cooking →
            </button>
          )}
        </div>

        {/* Quick picks */}
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
                  className="w-full text-left bg-white rounded-[14px] px-[14px] py-[13px] flex items-center gap-3 cursor-pointer"
                  style={{boxShadow:'0 6px 16px -14px rgba(26,46,26,.4)'}}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold text-[#1A2E1A]">{r.title}</p>
                    {r.channelName && (
                      <p className="mt-0.5 text-[11.5px] font-medium text-[#6B5B4E]">By {r.channelName}</p>
                    )}
                  </div>
                  {r.cuisineRegion && (
                    <span className="shrink-0 bg-[#1A2E1A]/06 rounded-[6px] px-[7px] py-[3px] text-[11px] font-semibold text-[#1A2E1A]">
                      {r.cuisineRegion}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Week strip */}
        <div className="mx-[22px] mt-[22px] bg-white rounded-[18px] p-4"
          style={{boxShadow:'0 6px 18px -16px rgba(26,46,26,.35)'}}>
          <WeekStrip
            weekDates={weekDates}
            mealPlanDates={mealPlanDates}
            cookedDates={[]}
            today={today}
            onDayClick={(date) => setPlanSheet({ date, mealType: 'Dinner' })}
            summary={weekPlanCount > 0 ? `${weekPlanCount} meal${weekPlanCount > 1 ? 's' : ''} planned this week` : 'No meals planned yet'}
          />
        </div>

        {/* Grocery reminder */}
        {hasMealPlanThisWeek && (
          <button onClick={() => navigate('/grocery')}
            className="mx-[22px] mt-[18px] flex items-center gap-3 rounded-[16px] px-[15px] py-[14px] border"
            style={{background:'#FCF0DC', borderColor:'rgba(184,121,10,.25)'}}>
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
        <MealPlanSheet date={planSheet.date} defaultMealType={planSheet.mealType}
          onClose={() => setPlanSheet(null)} onAdded={handlePlanAdded} />
      )}
    </div>
  )
}
