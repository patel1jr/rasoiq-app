/**
 * Returns a display name for a logged meal entry.
 * Priority: customName > stapleId (title-cased) > recipeTitle > "Meal"
 */
export function getMealName({ customName, stapleId, recipeTitle } = {}) {
  if (customName) return customName
  if (stapleId) {
    return stapleId
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }
  if (recipeTitle) return recipeTitle
  return 'Meal'
}
