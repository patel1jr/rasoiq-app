const API_URL = import.meta.env.VITE_API_URL

export async function extractRecipe(url, forceRefresh = false) {
  const res = await fetch(`${API_URL}/api/recipes/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, forceRefresh })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function saveRecipe(recipeId, token) {
  const res = await fetch(`${API_URL}/api/user/recipes/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ recipeId })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getSavedRecipes(token) {
  const res = await fetch(`${API_URL}/api/user/recipes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getRecipe(id) {
  const res = await fetch(`${API_URL}/api/recipes/${id}`)
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function logMeal(data, token) {
  const res = await fetch(`${API_URL}/api/meal-log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}
