import { useEffect, useState } from 'react'

const INGREDIENTS = [
  { emoji: '🧅', name: 'onion', delay: 0 },
  { emoji: '🌶️', name: 'chilli', delay: 0.4 },
  { emoji: '🧄', name: 'garlic', delay: 0.8 },
  { emoji: '🫚', name: 'oil', delay: 1.2 },
  { emoji: '🧂', name: 'salt', delay: 1.6 },
  { emoji: '🫙', name: 'spices', delay: 2.0 },
  { emoji: '🍅', name: 'tomato', delay: 2.4 },
  { emoji: '🌿', name: 'coriander', delay: 2.8 },
  { emoji: '🥛', name: 'dairy', delay: 3.2 },
]

const STAGES = [
  { label: 'Reading the video transcript', duration: 8000 },
  { label: 'Identifying ingredients', duration: 10000 },
  { label: 'Detecting cooking techniques', duration: 0 },
]

export default function ExtractionLoader() {
  const [visibleIngredients, setVisibleIngredients] = useState([])
  const [currentStage, setCurrentStage] = useState(0)
  const [dots, setDots] = useState('')

  // Show ingredients one by one on loop
  useEffect(() => {
    const timers = INGREDIENTS.map((ing) =>
      setTimeout(() => {
        setVisibleIngredients(prev => {
          if (prev.find(p => p.name === ing.name)) return prev
          return [...prev, ing]
        })
      }, ing.delay * 1000)
    )

    const resetTimer = setTimeout(() => {
      setVisibleIngredients([])
    }, 4500)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(resetTimer)
    }
  }, [visibleIngredients.length === 0 ? 0 : visibleIngredients.length])

  // Cycle through stages
  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStage(1), 8000)
    const timer2 = setTimeout(() => setCurrentStage(2), 18000)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px 24px',
      minHeight: '280px',
    }}>

      {/* rasoIQ wordmark pulsing */}
      <div style={{
        fontSize: 22,
        fontWeight: 900,
        marginBottom: 28,
        animation: 'pulse 2s ease-in-out infinite',
      }}>
        <span style={{ color: '#1A2E1A' }}>raso</span>
        <span style={{ color: '#E8611A' }}>IQ</span>
      </div>

      {/* Ingredient grid — 3x3 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 64px)',
        gridTemplateRows: 'repeat(3, 64px)',
        gap: 8,
        marginBottom: 32,
        position: 'relative',
      }}>
        {INGREDIENTS.map((ing) => {
          const isVisible = visibleIngredients.find(v => v.name === ing.name)
          return (
            <div
              key={ing.name}
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: isVisible ? '#FDF6EC' : '#F0EAE3',
                border: isVisible ? '1.5px solid rgba(232,97,26,0.19)' : '1.5px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                opacity: isVisible ? 1 : 0.25,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.8)',
                transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isVisible ? '0 2px 8px rgba(232,97,26,0.15)' : 'none',
              }}
            >
              {isVisible ? ing.emoji : ''}
            </div>
          )
        })}
      </div>

      {/* Stage indicators */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {STAGES.map((stage, i) => (
          <div
            key={stage.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              opacity: i <= currentStage ? 1 : 0.3,
              transition: 'opacity 0.5s ease',
            }}
          >
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              flexShrink: 0,
              background: i < currentStage ? '#2D7A5A' : i === currentStage ? '#E8611A' : '#E5E7EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'white',
              animation: i === currentStage ? 'spin 1s linear infinite' : 'none',
            }}>
              {i < currentStage ? '✓' : i === currentStage ? '◐' : ''}
            </div>

            <span style={{
              fontSize: 13,
              color: i === currentStage ? '#1A2E1A' : '#6B5B4E',
              fontWeight: i === currentStage ? 600 : 400,
            }}>
              {stage.label}{i === currentStage ? dots : ''}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
