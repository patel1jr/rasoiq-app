import { describe, it, expect } from 'vitest'
import { getVideoId } from '../../utils/videoId'

describe('getVideoId', () => {
  it('extracts ID from youtube.com/watch?v=', () => {
    expect(getVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL', () => {
    expect(getVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtube.com/shorts/', () => {
    expect(getVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for non-YouTube URL', () => {
    expect(getVideoId('https://vimeo.com/12345')).toBeNull()
  })

  it('handles URL with extra parameters after video ID', () => {
    expect(getVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for null input', () => {
    expect(getVideoId(null)).toBeNull()
  })
})
