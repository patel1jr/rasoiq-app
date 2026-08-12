const STREAK_KEY = 'rasoiq_streak'

export function getStreak() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || 'null') || { count: 0, lastDate: null }
  } catch {
    return { count: 0, lastDate: null }
  }
}

export function recordCookToday() {
  const today = new Date().toISOString().slice(0, 10)
  const streak = getStreak()
  if (streak.lastDate === today) return streak

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const newCount = streak.lastDate === yesterday ? streak.count + 1 : 1
  const updated = { count: newCount, lastDate: today }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}

export function getWeekDates(offsetWeeks = 0) {
  const now = new Date()
  const monday = new Date(now)
  const day = monday.getDay() || 7
  monday.setDate(monday.getDate() - day + 1 + offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}
