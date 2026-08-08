const KEY = 'rasoiq_extractions'
export const FREE_LIMIT = 3
const HISTORY_LIMIT = 20

export function getLocalExtractions() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function addLocalExtraction(recipe, isAuth = false) {
  const list = getLocalExtractions()
  const id = recipe.id || recipe.recipeId
  const filtered = list.filter(e => e.recipeId !== id)
  filtered.unshift({
    recipeId: id,
    title: recipe.title,
    sourceUrl: recipe.source?.url || recipe.sourceUrl,
    cuisineRegion: recipe.cuisineRegion,
    extractedAt: new Date().toISOString(),
    recipe, // store full recipe for instant navigation
  })
  // guests: cap at FREE_LIMIT for limit enforcement; auth users: keep more history
  localStorage.setItem(KEY, JSON.stringify(filtered.slice(0, isAuth ? HISTORY_LIMIT : FREE_LIMIT)))
}

export function clearLocalExtractions() {
  localStorage.removeItem(KEY)
}

export function isAtLimit() {
  return getLocalExtractions().length >= FREE_LIMIT
}
