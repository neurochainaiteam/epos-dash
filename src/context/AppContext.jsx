import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  capabilitiesForRole, effectivePermissionList,
  canAccess as canAccessFor, pagesForRole as pagesForRoleFor, landingPageForRole,
} from '@/config/roles'
import { LOCATIONS, ALL_LOCATIONS_ID } from '@/data/mockData'

const AppContext = createContext(null)

const PERMISSIONS_KEY = 'neurochain.permissions'

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function AppProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)   // { role, name, job_title, location_id }
  const [authLoading, setAuthLoading] = useState(true)
  const [permissions, setPermissions] = useState(() => loadJSON(PERMISSIONS_KEY, {}))

  // Fetch the profile row plus the matching location name for the given user ID.
  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, name, job_title, location_id')
      .eq('id', userId)
      .maybeSingle()
    if (error) throw new Error(`Profile fetch failed: ${error.message} (${error.code})`)
    if (!data) return null

    if (data.location_id) {
      const { data: loc } = await supabase
        .from('locations')
        .select('name')
        .eq('id', data.location_id)
        .maybeSingle()
      return { ...data, location_name: loc?.name ?? data.location_id }
    }

    return { ...data, location_name: null }
  }

  // On mount: restore the existing session (Supabase stores it in localStorage).
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        try {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
        } catch {
          setProfile(null)
        }
      }
      setAuthLoading(false)
    })

    // Only handle session restore and token rotation here.
    // SIGNED_IN is handled directly in signIn() to avoid a race.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
      } else if (event === 'TOKEN_REFRESHED' && s?.user) {
        setSession(s)
        try {
          const p = await fetchProfile(s.user.id)
          if (p) setProfile(p)
        } catch { /* keep existing profile on refresh error */ }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Persist Director-editable permission overrides locally.
  useEffect(() => {
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
  }, [permissions])

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    const p = await fetchProfile(data.user.id)
    if (!p) {
      await supabase.auth.signOut()
      throw new Error('Account found but no profile row exists. Run the director setup SQL in Supabase.')
    }
    setSession(data.session)
    setProfile(p)
    return p
  }

  async function signOut() {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  function setLocation(locationId) {
    setProfile((p) => (p ? { ...p, location_id: locationId } : p))
  }

  const setPermission = useCallback((role, pageKey, allowed) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...(prev[role] || {}), [pageKey]: allowed },
    }))
  }, [])

  const resetPermissions = useCallback(() => setPermissions({}), [])

  const role = profile?.role ?? null

  // Determine the active locationId: director defaults to 'all', others to their assigned location.
  const locationId = useMemo(() => {
    if (!profile) return LOCATIONS[0].id
    const caps = capabilitiesForRole(role)
    if (caps.allLocations) return profile.location_id || ALL_LOCATIONS_ID
    return profile.location_id || LOCATIONS[0].id
  }, [profile, role])

  const value = useMemo(() => {
    const effective = role ? effectivePermissionList(role, permissions) : []
    return {
      session,
      profile,
      role,
      isAuthed: !!session && !!profile,
      authLoading,
      locationId,
      signIn,
      signOut,
      setLocation,
      permissions,
      setPermission,
      resetPermissions,
      effectivePages: effective,
      canAccess: (pageKey) => effective.includes(pageKey),
      pagesForRole: (group) => pagesForRoleFor(role, group, permissions),
      canAccessAs: (r, pageKey) => canAccessFor(r, pageKey, permissions),
      landingPath: () => landingPageForRole(role, permissions),
    }
  }, [session, profile, role, authLoading, locationId, permissions, setPermission, resetPermissions])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
