import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Loader2, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getWeekMealPlan, getSavedRecipes } from '../lib/api'
import { getWeekDates, todayISO } from '../utils/streak'
import { getLocalExtractions } from '../lib/localExtractions'
import WeekStrip from '../components/WeekStrip'
import MealPlanSheet from '../components/MealPlanSheet'

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack']

function mealLabel(type) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const navigate = useNavigate()
  const session = useSession()

  const [weekPlan, setWeekPlan] = useState([])
  const [savedRecipes, setSavedRecipes] = useState([])
  const [planLoading, setPlanLoading] = useState(false)
  const [planSheet, setPlanSheet] = useState(null) // { date, mealType }

  const weekDates = getWeekDates()
  const today = todayISO()
  const startDate = weekDates[0]
  const endDate = weekDates[6]

  useEffect(() => {
    if (!session) return
    setPlanLoading(true)
    Promise.all([
      getWeekMealPlan(startDate, endDate, session.access_token)
        .catch(() => []),
      getSavedRecipes(session.access_token)
        .catch(() => []),
    ]).then(([plan, recipes]) => {
      setWeekPlan(Array.isArray(plan) ? plan : [])
      setSavedRecipes(Array.isArray(recipes) ? recipes : [])
    }).finally(() => setPlanLoading(false))
  }, [session, startDate, endDate])

  const todayPlan = weekPlan.filter(p => p.plannedDate === today)
  const plannedDates = [...new Set(weekPlan.map(p => p.plannedDate))]

  const localExtractions = getLocalExtractions()
  const isNewUser = !session && localExtractions.length === 0
  const isGuest = !session

  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0]
    || session?.user?.email?.split('@')[0]
    || null

  const avatarInitial = session
    ? (session.user.user_metadata?.full_name?.[0] || session.user.email?.[0] || '?').toUpperCase()
    : null

  function handlePlanAdded(entry) {
    setWeekPlan(prev => {
      const filtered = prev.filter(p => !(p.plannedDate === entry.plannedDate && p.mealType === entry.mealType))
      return [...filtered, entry]
    })
  }

  // ---- New / guest user state ----
  if (isNewUser || isGuest) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
        <div className="flex items-center justify-between px-5 pt-14 pb-2">
          <span className="font-display text-2xl font-bold text-[#1A2E1A]">
            raso<span className="text-[#E8611A]">IQ</span>
          </span>
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-semibold text-[#E8611A]"
          >
            Sign in
          </button>
        </div>

        <div className="px-5 pt-8">
          <h1 className="font-display text-3xl font-bold text-[#1A2E1A] leading-tight mb-2">
            Cook smarter, eat better.
          </h1>
          <p className="text-[#5A6B5A] text-[15px] leading-relaxed mb-8">
            Extract recipes from any Indian cooking video, plan your meals, and build a grocery list — all in one place.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => navigate('/discover')}
              className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-2xl text-[15px] flex items-center justify-center gap-2"
            >
              Extract your first recipe
              <ChevronRight size={18} />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="w-full bg-white border border-[#EDE8E0] text-[#1A2E1A] font-semibold py-4 rounded-2xl text-[15px]"
            >
              Sign in to continue
            </button>
          </div>

          {localExtractions.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-bold text-[#9B9490] uppercase tracking-wider mb-3">Recent</p>
              <div className="flex flex-col gap-2">
                {localExtractions.slice(0, 3).map(item => (
                  <button
                    key={item.recipeId}
                    onClick={() => navigate(`/recipe/${item.recipeId}`, { state: { recipe: item.recipe || item } })}
                    className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5 text-left"
                  >
                    <UtensilsCrossed size={16} className="text-[#E8611A] shrink-0" />
                    <p className="flex-1 text-sm font-semibold text-[#1A2E1A] truncate">{item.title}</p>
                    <ChevronRight size={16} className="text-[#C0B8AF] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ---- Signed-in state ----
  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC] pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-4">
        <div>
          <p className="text-xs text-[#9B9490] font-medium">{greeting()}</p>
          <h1 className="font-display text-xl font-bold text-[#1A2E1A]">
            {userName ? `${userName} 👋` : 'Welcome back 👋'}
          </h1>
        </div>
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-[#E8611A] flex items-center justify-center"
        >
          <span className="text-white text-sm font-bold">{avatarInitial}</span>
        </button>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Today's plan card */}
        <div className="bg-white rounded-3xl border border-[#EDE8E0] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold text-[#1A2E1A]">Today's Meals</p>
            <button
              onClick={() => navigate('/grocery')}
              className="flex items-center gap-1 text-[11px] font-semibold text-[#2D7A5A]"
            >
              <ShoppingCart size={13} />
              Grocery list
            </button>
          </div>

          {planLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin text-[#E8611A]" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {(['lunch', 'dinner', 'breakfast', 'snack']).map(mt => {
                const entry = todayPlan.find(p => p.mealType === mt)
                return (
                  <div key={mt} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-[#9B9490] w-16 shrink-0 uppercase tracking-wide">
                      {mealLabel(mt)}
                    </span>
                    {entry ? (
                      <button
                        className="flex-1 text-sm font-semibold text-[#1A2E1A] text-left truncate"
                        onClick={() => entry.recipeId && navigate(`/recipe/${entry.recipeId}`)}
                      >
                        {entry.title}
                      </button>
                    ) : (
                      <button
                        onClick={() => setPlanSheet({ date: today, mealType: mealLabel(mt) })}
                        className="flex items-center gap-1 text-xs font-semibold text-[#C0B8AF]"
                      >
                        <Plus size={13} />
                        Add
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Week strip */}
        <div className="bg-white rounded-3xl border border-[#EDE8E0] px-4 py-4">
          <p className="text-[12px] font-bold text-[#1A2E1A] mb-3">This Week</p>
          <WeekStrip
            weekDates={weekDates}
            plannedDates={plannedDates}
            today={today}
            onDayClick={(date) => setPlanSheet({ date, mealType: 'Dinner' })}
          />
        </div>

        {/* Quick picks from saved */}
        {savedRecipes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-bold text-[#1A2E1A]">Quick Picks</p>
              <button onClick={() => navigate('/saved')} className="text-xs font-semibold text-[#E8611A]">
                See all
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {savedRecipes.slice(0, 4).map(r => (
                <button
                  key={r.recipeId}
                  onClick={() => navigate(`/recipe/${r.recipeId}`, { state: { recipe: r } })}
                  className="flex items-center gap-3 bg-white border border-[#EDE8E0] rounded-2xl px-4 py-3.5 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#F3E2C4] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2E1A] truncate">{r.title}</p>
                    {r.cuisineRegion && (
                      <p className="text-xs text-[#9B9490] truncate">{r.cuisineRegion}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-[#C0B8AF] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grocery reminder */}
        {plannedDates.length > 0 && (
          <button
            onClick={() => navigate('/grocery')}
            className="flex items-center gap-4 bg-[#2D7A5A]/10 rounded-2xl px-4 py-4"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2D7A5A] flex items-center justify-center shrink-0">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-[#1A2E1A]">Your grocery list is ready</p>
              <p className="text-xs text-[#5A6B5A] mt-0.5">Based on this week's meal plan</p>
            </div>
            <ChevronRight size={16} className="text-[#2D7A5A] shrink-0" />
          </button>
        )}
      </div>

      {planSheet && (
        <MealPlanSheet
          date={planSheet.date}
          defaultMealType={planSheet.mealType}
          onClose={() => setPlanSheet(null)}
          onAdded={handlePlanAdded}
        />
      )}
    </div>
  )
}
