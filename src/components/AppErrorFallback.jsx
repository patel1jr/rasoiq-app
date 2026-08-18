import * as Sentry from '@sentry/react'

export default function AppErrorFallback() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#FDF6EC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Wordmark */}
      <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 40 }}>
        <span style={{ color: '#1A2E1A' }}>rasoi</span>
        <span style={{ color: '#E8611A' }}>IQ</span>
      </div>

      {/* Icon */}
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: '#FEF0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        marginBottom: 24,
      }}>
        🍳
      </div>

      <h1 style={{
        fontSize: 22,
        fontWeight: 800,
        color: '#1A2E1A',
        margin: '0 0 10px',
        textAlign: 'center',
      }}>
        Something went wrong
      </h1>

      <p style={{
        fontSize: 14,
        color: '#6B5B4E',
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: 280,
        margin: '0 0 36px',
      }}>
        We have been notified and will fix this soon.
      </p>

      <button
        onClick={() => window.location.href = '/'}
        style={{
          height: 52,
          paddingLeft: 36,
          paddingRight: 36,
          borderRadius: 26,
          background: '#E8611A',
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 8px 18px -8px rgba(232,97,26,.7)',
          marginBottom: 20,
        }}
      >
        Go home
      </button>

      <button
        onClick={() => Sentry.showReportDialog()}
        style={{
          background: 'none',
          border: 'none',
          color: '#6B5B4E',
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(107,91,78,.4)',
          padding: 0,
        }}
      >
        Report this issue
      </button>
    </div>
  )
}
