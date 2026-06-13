import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from '@/context/AppContext'
import AppLayout from '@/components/layout/AppLayout'
import RouteGuard from '@/components/RouteGuard'
import PageLoader from '@/components/PageLoader'

// Lazy-loaded routes (code-split per page for fast initial load)
const SignIn = lazy(() => import('@/pages/SignIn'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Orders = lazy(() => import('@/pages/Orders'))
const PnL = lazy(() => import('@/pages/PnL'))
const Inventory = lazy(() => import('@/pages/Inventory'))
const Recipes = lazy(() => import('@/pages/Recipes'))
const Waste = lazy(() => import('@/pages/Waste'))
const Staff = lazy(() => import('@/pages/Staff'))
const Schedule = lazy(() => import('@/pages/Schedule'))
const Checklists = lazy(() => import('@/pages/Checklists'))
const Bookings = lazy(() => import('@/pages/Bookings'))
const Analytics = lazy(() => import('@/pages/Analytics'))
const Recommendations = lazy(() => import('@/pages/Recommendations'))
const Forecasting = lazy(() => import('@/pages/Forecasting'))
const Marketing = lazy(() => import('@/pages/Marketing'))
const Billing = lazy(() => import('@/pages/Billing'))
const Expenses = lazy(() => import('@/pages/Expenses'))
const Integrations = lazy(() => import('@/pages/Integrations'))
const Permissions = lazy(() => import('@/pages/Permissions'))
const Settings = lazy(() => import('@/pages/Settings'))

// page key -> element, kept alongside roles.js page keys
const PROTECTED = [
  ['dashboard', Dashboard],
  ['orders', Orders],
  ['pnl', PnL],
  ['inventory', Inventory],
  ['recipes', Recipes],
  ['waste', Waste],
  ['staff', Staff],
  ['schedule', Schedule],
  ['checklists', Checklists],
  ['bookings', Bookings],
  ['analytics', Analytics],
  ['recommendations', Recommendations],
  ['forecasting', Forecasting],
  ['marketing', Marketing],
  ['billing', Billing],
  ['expenses', Expenses],
  ['integrations', Integrations],
  ['permissions', Permissions],
  ['settings', Settings],
]

function pathFor(key) {
  return key === 'dashboard' ? 'dashboard' : key
}

export default function App() {
  const { isAuthed, authLoading, landingPath } = useApp()
  const landing = isAuthed ? landingPath() : '/login'

  // While the Supabase session is being restored, render nothing to avoid a
  // flash-redirect to /login for users who are actually authenticated.
  if (authLoading) return null

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/login"
          element={isAuthed ? <Navigate to={landing} replace /> : <SignIn />}
        />

        <Route element={<AppLayout />}>
          {PROTECTED.map(([key, Component]) => (
            <Route
              key={key}
              path={`/${pathFor(key)}`}
              element={
                <RouteGuard pageKey={key}>
                  <Component />
                </RouteGuard>
              }
            />
          ))}
        </Route>

        <Route
          path="/"
          element={<Navigate to={landing} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={landing} replace />}
        />
      </Routes>
    </Suspense>
  )
}
