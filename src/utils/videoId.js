/**
 * Extracts the YouTube video ID from various URL formats.
 * Returns null for non-YouTube URLs.
 */
export function getVideoId(url) {
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([^&\s?]+)/)
  return m ? m[1] : null
}

export function thumbUrl(url) {
  const id = getVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

// Alias used by newer components
export const getThumbnailUrl = thumbUrl

export function isYouTubeUrl(url) {
  if (!url) return false
  return url.includes('youtube.com') || url.includes('youtu.be')
}
