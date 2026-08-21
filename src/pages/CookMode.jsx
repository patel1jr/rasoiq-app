import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { X, ArrowLeft, Clock, Zap, ChevronRight, Check } from 'lucide-react'
import { useSession } from '../lib/useSession'
import { getRecipe, logMeal } from '../lib/api'

// ─── Coaching tips keyed by technique id/name ──────────────────────────────
const TECHNIQUE_TIPS = {
  tadka:            'Jeera first — wait for it to splutter before adding the next spice',
  tempering:        'Jeera first — wait for it to splutter before adding the next spice',
  bhuna:            'Cook until you see oil separating at the edges',
  bhunna:           'Cook until you see oil separating at the edges',
  dum:              'Keep flame on lowest setting — patience is key',
  pressure_cooking: 'Count whistles, not minutes',
  soaking:          'The longer the soak, the creamier the result',
  kneading:         'Dough should be soft but not sticky — adjust with water',
  roasting:         'Stir constantly — spices burn in seconds',
  frying:           'Oil must be hot before adding — test with a small piece first',
}

function getTip(technique) {
  if (!technique) return null
  const key = technique.toLowerCase().replace(/\s+/g, '_')
  return TECHNIQUE_TIPS[key] || null
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function stepTitle(step) {
  if (step.title) return step.title
  const words = step.instruction?.split(/\s+/) || []
  return words.slice(0, 6).join(' ') + (words.length > 6 ? '…' : '')
}

function formatTimer(secs) {
  if (secs >= 3600) {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDuration(mins) {
  if (!mins) return ''
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ─── Timer component ───────────────────────────────────────────────────────
// timerState lives in a ref in CookMode so it survives step navigation (re-mounts).
// Elapsed time is always computed from Date.now() — never counted down in state.
function StepTimer({ durationMinutes, timerState, onUpdate }) {
  const totalSecs = durationMinutes * 60
  const [, tick] = useState(0) // only used to trigger re-renders
  const intervalRef = useRef(null)

  const running = timerState.startedAt !== null
  const elapsed = Math.min(
    totalSecs,
    timerState.accumulated + (running ? Math.floor((Date.now() - timerState.startedAt) / 1000) : 0)
  )
  const timeLeft = totalSecs - elapsed
  const done = timerState.done

  // Drive re-renders while running
  useEffect(() => {
    if (running && !done) {
      intervalRef.current = setInterval(() => {
        const e = timerState.accumulated + Math.floor((Date.now() - timerState.startedAt) / 1000)
        if (e >= totalSecs) {
          onUpdate({ startedAt: null, accumulated: totalSecs, done: true })
          clearInterval(intervalRef.current)
        }
        tick(t => t + 1)
      }, 500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, done])

  function toggleTimer() {
    if (done) return
    if (running) {
      const newAccumulated = timerState.accumulated + Math.floor((Date.now() - timerState.startedAt) / 1000)
      onUpdate({ startedAt: null, accumulated: Math.min(newAccumulated, totalSecs) })
    } else {
      onUpdate({ startedAt: Date.now() })
    }
    tick(t => t + 1)
  }

  const isLongRest = durationMinutes >= 240
  const label = isLongRest ? "Long rest — we'll remind you" : 'Step timer'

  return (
    <div className="bg-white rounded-2xl border border-[#EDE8E0] p-4 mt-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#E8611A]" />
          <span className="text-xs font-semibold text-[#9B9490]">{label}</span>
        </div>
        <span className="text-[#9B9490] text-xs">{formatDuration(durationMinutes)}</span>
      </div>

      {done ? (
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="w-8 h-8 rounded-full bg-[#2D7A5A] flex items-center justify-center">
            <Check size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-[#2D7A5A] font-bold text-base">Done!</span>
        </div>
      ) : (
        <>
          <p
            className="text-center font-mono text-[2.5rem] font-bold text-[#1A2E1A] leading-none my-2 tabular-nums"
            style={{ letterSpacing: '0.05em' }}
          >
            {formatTimer(timeLeft)}
          </p>
          <button
            onClick={toggleTimer}
            className="mt-3 w-full border-2 border-[#E8611A] text-[#E8611A] font-semibold py-2.5 rounded-full text-sm transition-colors hover:bg-[#FEF0E8]"
          >
            {running ? 'Pause' : elapsed > 0 ? 'Resume' : 'Start timer'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── Technique sheet ───────────────────────────────────────────────────────
const META_LABELS = {
  fat: 'Fat',
  heat_level: 'Heat',
  spices_sequence: 'Sequence',
  technique_duration: 'Timing',
  pan_type: 'Pan type',
  texture_goal: 'Texture goal',
}

function TechniqueSheet({ technique, onClose }) {
  if (!technique) return null
  const name = technique.displayName || technique.name || technique.title || ''
  const metaEntries = Object.entries(META_LABELS).filter(([k]) => technique[k] != null)

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-3xl z-50 px-6 pt-5 pb-10">
        <div className="flex items-center justify-between mb-5">
          <span
            className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ backgroundColor: '#EAF3EC', color: '#2D7A5A' }}
          >
            Technique
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0EBE4] flex items-center justify-center"
          >
            <X size={16} className="text-[#5A6B5A]" />
          </button>
        </div>

        <h3 className="font-display text-lg font-bold text-[#1A2E1A] mb-2">{name}</h3>
        <p className="text-sm text-[#5A6B5A] leading-relaxed">
          {technique.description || 'A key cooking technique used in Indian cuisine.'}
        </p>

        {metaEntries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#F0EBE4] flex flex-col gap-3">
            {metaEntries.map(([key, label]) => {
              const val = technique[key]
              return (
                <div key={key} className="flex items-start justify-between gap-3">
                  <span className="text-xs text-[#9B9490] w-24 shrink-0">{label}</span>
                  <span className="text-xs font-bold text-[#1A2E1A] text-right flex-1">
                    {Array.isArray(val) ? val.join(' → ') : String(val)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Completion screen ─────────────────────────────────────────────────────
function CompletionScreen({ recipe, onReset, session }) {
  const navigate = useNavigate()
  const logged = useRef(false)

  useEffect(() => {
    if (!session || logged.current) return
    logged.current = true
    logMeal(
      {
        mealType: 'dinner',
        sourceType: 'extracted',
        recipeId: recipe.id || recipe.recipeId,
        servings: 2,
      },
      session.access_token
    ).catch(() => {})
  }, [session, recipe])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-[#2D7A5A] flex items-center justify-center mb-6">
        <Check size={36} className="text-white" strokeWidth={2.5} />
      </div>
      <h1 className="font-display text-2xl font-bold text-[#1A2E1A] leading-snug mb-2">
        {recipe.title}, done!
      </h1>
      <p className="text-sm text-[#9B9490] mb-10">Logged to your cooking history</p>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#E8611A] text-white font-bold py-4 rounded-full text-[15px]"
        >
          Done
        </button>
        <button
          onClick={onReset}
          className="w-full border-2 border-[#E8611A] text-[#E8611A] font-semibold py-4 rounded-full text-[15px]"
        >
          Cook again
        </button>
      </div>
    </div>
  )
}

// ─── Main CookMode page ────────────────────────────────────────────────────
export default function CookMode() {
  const { state } = useLocation()
  const { id } = useParams()
  const navigate = useNavigate()
  const session = useSession()

  const [recipe, setRecipe] = useState(state?.recipe || null)
  const [loading, setLoading] = useState(!state?.recipe && !!id)
  const [fetchError, setFetchError] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [finished, setFinished] = useState(false)
  const [techniqueSheet, setTechniqueSheet] = useState(null)
  const contentRef = useRef(null)
  // Persists timer state across step navigation — keyed by step index
  const timersRef = useRef({})

  function getTimerState(idx) {
    if (!timersRef.current[idx]) {
      timersRef.current[idx] = { startedAt: null, accumulated: 0, done: false }
    }
    return timersRef.current[idx]
  }

  // Fetch recipe if not in state
  useEffect(() => {
    if (state?.recipe) { setRecipe(state.recipe); return }
    if (!id) { navigate('/'); return }
    setLoading(true)
    getRecipe(id)
      .then(setRecipe)
      .catch(() => setFetchError('Could not load recipe.'))
      .finally(() => setLoading(false))
  }, [id])

  // Scroll to top on step change
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stepIndex])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FDF6EC]">
        <div className="w-8 h-8 border-2 border-[#E8611A] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (fetchError || !recipe) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#FDF6EC] gap-4 px-8 text-center">
        <p className="text-sm text-[#5A6B5A]">{fetchError || 'Recipe not found.'}</p>
        <button onClick={() => navigate(-1)} className="text-[#E8611A] font-semibold text-sm">Go back</button>
      </div>
    )
  }

  const steps = [...(recipe.steps || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const total = steps.length

  if (finished) {
    return (
      <CompletionScreen
        recipe={recipe}
        session={session}
        onReset={() => { setStepIndex(0); setFinished(false) }}
      />
    )
  }

  if (!total) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#FDF6EC] gap-4 px-8 text-center">
        <p className="text-sm text-[#5A6B5A]">No steps found for this recipe.</p>
        <button onClick={() => navigate(-1)} className="text-[#E8611A] font-semibold text-sm">Go back</button>
      </div>
    )
  }

  const step = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === total - 1

  // Find full technique object from recipe.techniques
  const techniqueObj = step.technique
    ? recipe.techniques?.find(t =>
        (t.id || t.name || t.title || '').toLowerCase() === step.technique.toLowerCase()
      )
    : null
  const coachingTip = getTip(step.technique)

  function goNext() {
    if (isLast) { setFinished(true); return }
    setStepIndex(i => i + 1)
  }

  function goBack() {
    if (!isFirst) setStepIndex(i => i - 1)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF6EC]">

      {/* ── Top bar ── */}
      <div className="shrink-0 pt-12 px-5 pb-3 bg-[#FDF6EC]">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white border border-[#EDE8E0] flex items-center justify-center shrink-0"
          >
            <X size={17} className="text-[#5A6B5A]" />
          </button>
          <div className="flex-1 text-center px-3">
            <p className="text-sm font-semibold text-[#1A2E1A]">
              Step {stepIndex + 1} of {total}
            </p>
            <p className="text-[11px] text-[#9B9490] truncate mt-0.5">{recipe.title}</p>
          </div>
          {/* spacer to balance the X button */}
          <div className="w-9 shrink-0" />
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="shrink-0 flex gap-1 px-5 pb-4">
        {steps.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: '#E5E7EB' }}
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i < stepIndex
                  ? 'w-full bg-[#E8611A]'
                  : i === stepIndex
                  ? 'w-full bg-[#E8611A] animate-pulse'
                  : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* ── Scrollable content ── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-6 pt-2 pb-32">

        {/* Step number circle */}
        <div className="w-12 h-12 rounded-full bg-[#E8611A] flex items-center justify-center">
          <span className="text-white font-bold text-xl">{stepIndex + 1}</span>
        </div>

        {/* Step title */}
        <h2 className="font-display text-xl font-bold text-[#1A2E1A] mt-4 leading-snug">
          {stepTitle(step)}
        </h2>

        {/* Timer card */}
        {step.durationMinutes > 0 && (
          <StepTimer
            key={stepIndex}
            durationMinutes={step.durationMinutes}
            timerState={getTimerState(stepIndex)}
            onUpdate={(patch) => Object.assign(timersRef.current[stepIndex], patch)}
          />
        )}

        {/* Ingredients needed */}
        {step.ingredientsNeeded?.length > 0 && (
          <div className="mt-5">
            <p className="text-[10px] font-bold text-[#9B9490] uppercase tracking-widest mb-2">
              You'll need now
            </p>
            <div className="flex flex-wrap gap-2">
              {step.ingredientsNeeded.map((ing, i) => {
                const name = typeof ing === 'string' ? ing : ing.name
                const match = recipe.ingredients?.find(
                  r => r.name?.toLowerCase() === name?.toLowerCase()
                )
                const qty = match?.quantity ?? null
                const unit = match?.unit ?? null
                const label = [qty, unit, name].filter(Boolean).join(' ')
                return (
                  <span
                    key={i}
                    className="shrink-0 bg-white border border-[#EDE8E0] text-[#1A2E1A] text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap"
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Technique coaching card */}
        {step.technique && (
          <div
            className="mt-4 rounded-2xl border px-4 py-3.5"
            style={{ backgroundColor: '#2D7A5A0D', borderColor: '#2D7A5A33' }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-widest mb-1"
              style={{ color: '#2D7A5A' }}
            >
              {step.technique}
            </p>
            {coachingTip && (
              <p className="text-sm text-[#1A2E1A] leading-relaxed mb-2">{coachingTip}</p>
            )}
            <button
              onClick={() => setTechniqueSheet(techniqueObj || { name: step.technique })}
              className="text-xs font-semibold"
              style={{ color: '#2D7A5A' }}
            >
              View full technique →
            </button>
          </div>
        )}

        {/* Intelligence tip */}
        {step.tip && (
          <div
            className="mt-3 rounded-2xl px-4 py-3.5 flex gap-3 items-start"
            style={{ backgroundColor: '#E8611A0D' }}
          >
            <Zap size={15} className="text-[#E8611A] shrink-0 mt-0.5" />
            <p className="text-sm text-[#5A6B5A] leading-relaxed italic">{step.tip}</p>
          </div>
        )}

        {/* Full instruction */}
        <p className="mt-5 text-[15px] text-[#1A2E1A] leading-relaxed">
          {step.instruction}
        </p>

      </div>

      {/* ── Bottom navigation ── */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#EDE8E0] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            aria-label="Previous step"
            onClick={goBack}
            disabled={isFirst}
            className={`w-12 h-12 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
              isFirst
                ? 'border-[#E5E7EB] text-[#D0C8C0] bg-white cursor-not-allowed'
                : 'border-[#E8611A] text-[#E8611A] bg-white'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={goNext}
            className="flex-1 bg-[#E8611A] text-white font-semibold py-3.5 rounded-full text-[15px] flex items-center justify-center gap-1.5"
          >
            {isLast ? 'Finish cooking' : 'Next step'}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Technique detail sheet */}
      {techniqueSheet && (
        <TechniqueSheet
          technique={techniqueSheet}
          onClose={() => setTechniqueSheet(null)}
        />
      )}
    </div>
  )
}
