// ---------------------------------------------------------------------------
// Central role + permissions configuration.
//
// This is the single source of truth for:
//   - which roles exist
//   - the DEFAULT pages/features each role can access
//   - the order + grouping of nav items in the sidebar
//
// Permissions are DATA-DRIVEN and live-editable: a Director can override the
// defaults per role on the Permissions screen (persisted in localStorage and
// merged on top of the defaults here). The sidebar and the route guards both
// derive access from the *effective* permission set, so adding a page or
// changing who can see it is a one-line edit here — or a click for a Director.
// ---------------------------------------------------------------------------

export const ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  DIRECTOR: 'director',
}

// Human-friendly metadata for each role (used on the sign-in screen + sidebar).
export const ROLE_META = {
  [ROLES.STAFF]: {
    label: 'Staff',
    blurb: 'Orders, rota and opening/closing checklists for the floor team.',
    sampleName: 'Aisha Khan',
    jobTitle: 'Front of House',
  },
  [ROLES.MANAGER]: {
    label: 'Manager',
    blurb: 'Full single-site operations: inventory, waste, analytics & forecasting.',
    sampleName: 'Daniel Osei',
    jobTitle: 'Branch Manager',
  },
  [ROLES.DIRECTOR]: {
    label: 'Director',
    blurb: 'Every page, every location, financials, billing and permissions.',
    sampleName: 'Anwar',
    jobTitle: 'Owner',
  },
}

// The full page registry. `key` is used everywhere; `path` is the route;
// `icon` is a lucide-react icon name resolved in the sidebar.
// `group` controls where it sits in the sidebar (main vs admin footer).
export const PAGES = [
  // Recommendations sits first: it's the sidebar's top item and the default
  // landing page for any role that can see it (Manager/Director). Staff can't
  // access it, so they still land on their first allowed page (Orders).
  // Forecasting was merged into Recommendations (single "Recommendations"
  // nav item, no standalone Forecasting page/route).
  { key: 'recommendations', label: 'Recommendations', path: '/recommendations', icon: 'Sparkles', group: 'main' },
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', group: 'main' },
  { key: 'orders', label: 'Orders', path: '/orders', icon: 'ReceiptText', group: 'main' },
  { key: 'pnl', label: 'P&L', path: '/pnl', icon: 'TrendingUp', group: 'main' },
  { key: 'inventory', label: 'Inventory', path: '/inventory', icon: 'Package', group: 'main' },
  { key: 'recipes', label: 'Recipes', path: '/recipes', icon: 'CookingPot', group: 'main' },
  { key: 'waste', label: 'Waste', path: '/waste', icon: 'Trash2', group: 'main' },
  // Schedule was merged into Staff (single "Staff & Schedule" nav item).
  { key: 'staff', label: 'Staff & Schedule', path: '/staff', icon: 'Users', group: 'main' },
  { key: 'checklists', label: 'Checklists', path: '/checklists', icon: 'ListChecks', group: 'main' },
  { key: 'bookings', label: 'Bookings', path: '/bookings', icon: 'BookMarked', group: 'main' },
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: 'BarChart3', group: 'main' },
  { key: 'marketing', label: 'Marketing', path: '/marketing', icon: 'MessageSquare', group: 'main' },
  { key: 'expenses', label: 'Expenses', path: '/expenses', icon: 'Wallet', group: 'main' },
  { key: 'billing', label: 'Billing & Plans', path: '/billing', icon: 'CreditCard', group: 'admin' },
  { key: 'integrations', label: 'Integrations', path: '/integrations', icon: 'Plug', group: 'admin' },
  { key: 'permissions', label: 'User Permissions', path: '/permissions', icon: 'ShieldCheck', group: 'admin' },
  { key: 'settings', label: 'Settings', path: '/settings', icon: 'Settings', group: 'admin' },
]

// ---- DEFAULT permission matrix --------------------------------------------
// Cumulative tiers:
//   Staff   = orders, staff & schedule, opening/closing checklists.
//   Manager = Staff + full single-site operations (waste + inventory + the rest).
//   Director = everything: full financials, multi-site reporting, billing,
//              expenses, integrations, settings and the permissions screen.
const STAFF_PAGES = ['orders', 'staff', 'checklists']

const MANAGER_PAGES = [
  'recommendations',
  'dashboard',
  'orders',
  'pnl',
  'inventory',
  'recipes',
  'waste',
  'staff',
  'checklists',
  'bookings',
  'analytics',
  'marketing',
]

const DIRECTOR_PAGES = PAGES.map((p) => p.key) // all pages

export const DEFAULT_PERMISSIONS = {
  [ROLES.STAFF]: STAFF_PAGES,
  [ROLES.MANAGER]: MANAGER_PAGES,
  [ROLES.DIRECTOR]: DIRECTOR_PAGES,
}

// Director access is structural and cannot be edited away (no locking yourself
// out). Only Staff + Manager rows are editable on the Permissions screen.
export const EDITABLE_ROLES = [ROLES.STAFF, ROLES.MANAGER]

// Pages a role may NEVER be granted, even by an override (keeps the demo's tier
// story coherent — e.g. Staff can't be handed company billing).
const ROLE_MAX = {
  [ROLES.STAFF]: ['recommendations', 'dashboard', 'orders', 'pnl', 'inventory', 'recipes', 'waste', 'staff', 'checklists', 'bookings', 'analytics', 'marketing'],
  [ROLES.MANAGER]: MANAGER_PAGES,
  [ROLES.DIRECTOR]: DIRECTOR_PAGES,
}

// Whether a role may switch between / aggregate multiple locations.
// Staff + Manager are pinned to a single location; Director can switch freely
// and see an "All locations" roll-up.
export const ROLE_CAPABILITIES = {
  [ROLES.STAFF]: { switchLocations: false, allLocations: false },
  [ROLES.MANAGER]: { switchLocations: false, allLocations: false },
  [ROLES.DIRECTOR]: { switchLocations: true, allLocations: true },
}

// ---- Effective-permission helpers -----------------------------------------
// `overrides` shape: { [role]: { [pageKey]: boolean } } — a sparse map layered
// on top of DEFAULT_PERMISSIONS. Director is always full access.

export function effectivePermissionList(role, overrides) {
  if (role === ROLES.DIRECTOR) return DIRECTOR_PAGES
  const base = DEFAULT_PERMISSIONS[role] || []
  const ov = (overrides && overrides[role]) || {}
  const allowedSet = new Set(base)
  for (const [key, allowed] of Object.entries(ov)) {
    if (allowed) allowedSet.add(key)
    else allowedSet.delete(key)
  }
  const cap = new Set(ROLE_MAX[role] || [])
  return PAGES.map((p) => p.key).filter((k) => allowedSet.has(k) && cap.has(k))
}

export function canAccess(role, pageKey, overrides) {
  if (!role) return false
  return effectivePermissionList(role, overrides).includes(pageKey)
}

/** Whether a page key is even eligible for a role (used to grey-out toggles). */
export function isPageAllowedForRole(role, pageKey) {
  return (ROLE_MAX[role] || []).includes(pageKey)
}

/** Pages a role can access, in registry order, optionally filtered by group. */
export function pagesForRole(role, group, overrides) {
  const allowed = new Set(effectivePermissionList(role, overrides))
  return PAGES.filter((p) => allowed.has(p.key) && (group ? p.group === group : true))
}

/** The first page a role should land on after sign-in. */
export function landingPageForRole(role, overrides) {
  const pages = pagesForRole(role, 'main', overrides)
  return pages.length ? pages[0].path : '/orders'
}

export function capabilitiesForRole(role) {
  return ROLE_CAPABILITIES[role] || { switchLocations: false, allLocations: false }
}
