import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'
import AppErrorFallback from './components/AppErrorFallback.jsx'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Network request failed',
  ],
  beforeSend(event) {
    if (window.location.hostname === 'localhost') return null
    return event
  },
})

createRoot(document.getElementById('root')).render(
  <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>
  </Sentry.ErrorBoundary>
)
