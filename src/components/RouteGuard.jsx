import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '@/context/AppContext'

/**
 * Wraps a protected page. Redirects to /login when signed out, or to the
 * role's landing page when the role isn't permitted to see `pageKey`.
 * Permissions come from src/config/roles.js merged with any Director overrides
 * (resolved in AppContext), so this stays purely declarative.
 */
export default function RouteGuard({ pageKey, children }) {
  const { isAuthed, authLoading, canAccess, landingPath } = useApp()
  const location = useLocation()

  // Supabase session restore is async — don't flash the login screen.
  if (authLoading) return null

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (pageKey && !canAccess(pageKey)) {
    return <Navigate to={landingPath()} replace />
  }
  return children
}
