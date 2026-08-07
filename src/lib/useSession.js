import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { getLocalExtractions, clearLocalExtractions } from './localExtractions'

async function migrateIfNeeded(session) {
  if (!session) return
  const local = getLocalExtractions()
  if (!local.length) return
  try {
    const { saveRecipe } = await import('./api')
    await Promise.all(local.map(e => saveRecipe(e.recipeId, session.access_token).catch(() => {})))
    clearLocalExtractions()
  } catch {
    // silent
  }
}

export function useSession() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      // Migrate localStorage recipes on first sign-in (covers Google OAuth redirect)
      if (event === 'SIGNED_IN') migrateIfNeeded(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return session
}
