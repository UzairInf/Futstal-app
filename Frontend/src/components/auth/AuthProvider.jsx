import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../../context/authContext.js'
import { supabase } from '../../lib/supabaseClient.js'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileState, setProfileState] = useState({ userId: null, data: null, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  const userId = session?.user?.id ?? null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // Load the profile whenever the logged-in user changes (or a retry is requested)
  useEffect(() => {
    if (!userId) return
    let cancelled = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled) {
          setProfileState({ userId, data, error: error?.message ?? null })
        }
      })

    return () => { cancelled = true }
  }, [userId, reloadKey])

  const refreshProfile = useCallback(() => setReloadKey((k) => k + 1), [])

  const replaceProfile = useCallback(
    (data) => setProfileState({ userId, data, error: null }),
    [userId]
  )

  const profileReady = !userId || profileState.userId === userId
  const profile = userId && profileState.userId === userId ? profileState.data : null
  const profileError = userId && profileState.userId === userId ? profileState.error : null

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      profile,
      profileLoading: !profileReady,
      profileError,
      refreshProfile,
      replaceProfile,
      signOut: () => supabase.auth.signOut(),
    }),
    [session, loading, profile, profileReady, profileError, refreshProfile, replaceProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}