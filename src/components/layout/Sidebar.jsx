import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ReceiptText, TrendingUp, Boxes, CookingPot, Trash2, Users,
  CalendarDays, ListChecks, BookMarked, BarChart3, Sparkles, CreditCard, Settings,
  LineChart, MessageSquare, Wallet, Plug, ShieldCheck,
  LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { ROLE_META } from '@/config/roles'
import BrandMark from '@/components/BrandMark'
import LocationSwitcher from './LocationSwitcher'

const ICONS = {
  LayoutDashboard, ReceiptText, TrendingUp, Boxes, CookingPot, Trash2, Users,
  CalendarDays, ListChecks, BookMarked, BarChart3, Sparkles, CreditCard, Settings,
  LineChart, MessageSquare, Wallet, Plug, ShieldCheck,
}

function NavItem({ page, onNavigate }) {
  const Icon = ICONS[page.icon] || LayoutDashboard
  return (
    <NavLink
      to={page.path}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'nav-active text-white'
            : 'text-sidebar-foreground hover:bg-white/5 hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-sidebar-accent')} />
          <span className="truncate">{page.label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ onNavigate, onClose }) {
  const { role, profile, signOut, pagesForRole } = useApp()
  const mainPages = pagesForRole('main')
  const adminPages = pagesForRole('admin')
  const capitalise = (str) => str.charAt(0).toUpperCase() + str.slice(1)
  const roleLabel = capitalise(ROLE_META[role]?.label ?? role ?? '')
  const businessName = profile?.location_id ? (profile?.location_name ?? profile.location_id) : 'All Locations'

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-accent/10 ring-1 ring-sidebar-accent/30">
            <BrandMark className="h-7 w-7" />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-white">
              NeuroChain <span className="text-gradient">Ai</span>
            </div>
            <div className="text-[11px] font-medium text-sidebar-foreground">Operations &amp; P&amp;L</div>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-sidebar-foreground hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Location switcher */}
      <div className="px-3 pb-2">
        <LocationSwitcher />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {mainPages.map((page) => (
          <NavItem key={page.key} page={page} onNavigate={onNavigate} />
        ))}

        {adminPages.length > 0 && (
          <>
            <div className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/60">
              Administration
            </div>
            {adminPages.map((page) => (
              <NavItem key={page.key} page={page} onNavigate={onNavigate} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/20 text-sm font-bold text-sidebar-accent">
            {profile?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-semibold text-white">{profile?.name}</div>
            <div className="truncate text-xs text-sidebar-foreground">{businessName} · {roleLabel}</div>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-2 text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Powered by */}
        <div className="mt-2 flex items-center gap-1.5 px-2 text-[11px] font-medium text-sidebar-foreground/70">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
          Powered by <span className="text-gradient font-semibold">NeuroChain</span>
        </div>
      </div>
    </div>
  )
}
