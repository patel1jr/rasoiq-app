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
  // 409 = already saved — treat as success, fetch the existing entry
  if (res.status === 409) {
    const saved = await getSavedRecipes(token)
    const list = Array.isArray(saved) ? saved : []
    const existing = list.find(r => r.recipeId === recipeId)
    return existing || { userRecipeId: null }
  }
  if (!res.ok) {
    const body = await res.text()
    let parsed
    try { parsed = JSON.parse(body) } catch { parsed = { message: body || `HTTP ${res.status}` } }
    throw parsed
  }
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

export async function unsaveRecipe(userRecipeId, token) {
  const res = await fetch(`${API_URL}/api/user/recipes/${userRecipeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getCollections(token) {
  const res = await fetch(`${API_URL}/api/collections`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function createCollection(name, emoji, token) {
  const res = await fetch(`${API_URL}/api/collections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name, emoji })
  })
  if (!res.ok) {
    const body = await res.text()
    let parsed
    try { parsed = JSON.parse(body) } catch { parsed = { message: body || `HTTP ${res.status}` } }
    throw parsed
  }
  return res.json()
}

export async function addToCollection(collectionId, userRecipeId, token) {
  const res = await fetch(`${API_URL}/api/collections/${collectionId}/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ userRecipeId })
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function removeFromCollection(collectionId, userRecipeId, token) {
  const res = await fetch(`${API_URL}/api/collections/${collectionId}/recipes/${userRecipeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getCollectionRecipes(collectionId, token) {
  const res = await fetch(`${API_URL}/api/collections/${collectionId}/recipes`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getWeekMealPlan(startDate, endDate, token) {
  const res = await fetch(`${API_URL}/api/meal-plan?startDate=${startDate}&endDate=${endDate}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function addToMealPlan(data, token) {
  const res = await fetch(`${API_URL}/api/meal-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function removeFromMealPlan(id, token) {
  const res = await fetch(`${API_URL}/api/meal-plan/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function getGroceryList(startDate, endDate, token) {
  const res = await fetch(`${API_URL}/api/meal-plan/grocery-list?startDate=${startDate}&endDate=${endDate}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  if (!res.ok) throw await res.json()
  return res.json()
}

export async function checkGroceryItem(itemKey, checked, token) {
  const res = await fetch(`${API_URL}/api/meal-plan/grocery-list/check`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ itemKey, checked })
  })
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
