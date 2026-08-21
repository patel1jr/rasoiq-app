const FRACTION_MAP = {
  0.25: '¼',
  0.33: '⅓',
  0.5:  '½',
  0.67: '⅔',
  0.75: '¾',
}

export function formatQuantity(qty) {
  if (qty == null) return ''
  const whole = Math.floor(qty)
  const decimal = Math.round((qty - whole) * 100) / 100

  const frac = FRACTION_MAP[decimal] ?? null

  if (frac) return whole > 0 ? `${whole}${frac}` : frac
  // Not a recognised fraction — show as compact number (strip trailing zeros)
  return qty % 1 === 0 ? String(qty) : String(parseFloat(qty.toFixed(2)))
}
