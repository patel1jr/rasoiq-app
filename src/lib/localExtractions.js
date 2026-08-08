const KEY = 'rasoiq_extractions'
export const FREE_LIMIT = 3
const RETENTION_DAYS = 7
const MAX_STORED = 100 // hard cap so localStorage doesn't grow unbounded

export function getLocalExtractions() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function addLocalExtraction(recipe, isAuth = false) {
  const list = getLocalExtractions()
  const id = recipe.id || recipe.recipeId
  // Remove duplicate entry for same recipe, add fresh one at top
  const filtered = list.filter(e => e.recipeId !== id)
  filtered.unshift({
    recipeId: id,
    title: recipe.title,
    sourceUrl: recipe.source?.url || recipe.sourceUrl,
    cuisineRegion: recipe.cuisineRegion,
    extractedAt: new Date().toISOString(),
    recipe,
  })
  // For guests: keep at most FREE_LIMIT (for the free-tier enforcement logic).
  // For auth users: keep everything within retention window + hard cap.
  const toSave = isAuth
    ? filtered.slice(0, MAX_STORED)
    : filtered.slice(0, FREE_LIMIT)
  localStorage.setItem(KEY, JSON.stringify(toSave))
}

// Returns entries extracted within the last `days` days (default 7).
// For guests this is still capped at FREE_LIMIT entries total.
export function getRecentExtractions(days = RETENTION_DAYS) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return getLocalExtractions().filter(e => new Date(e.extractedAt).getTime() >= cutoff)
}

export function clearLocalExtractions() {
  localStorage.removeItem(KEY)
}

export function isAtLimit() {
  return getLocalExtractions().length >= FREE_LIMIT
}
