const KEY = 'rasoiq_extractions'
export const FREE_LIMIT = 3

export function getLocalExtractions() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export function addLocalExtraction(recipe) {
  const list = getLocalExtractions()
  if (list.find(e => e.recipeId === (recipe.id || recipe.recipeId))) return
  list.unshift({ recipeId: recipe.id || recipe.recipeId, title: recipe.title, extractedAt: new Date().toISOString() })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, FREE_LIMIT)))
}

export function clearLocalExtractions() {
  localStorage.removeItem(KEY)
}

export function isAtLimit() {
  return getLocalExtractions().length >= FREE_LIMIT
}
