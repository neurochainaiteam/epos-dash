import { useEffect, useRef, useState } from 'react'
import { Check, ChevronsUpDown, MapPin, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/context/AppContext'
import { capabilitiesForRole } from '@/config/roles'
import { LOCATIONS, ALL_LOCATIONS_ID, locationName } from '@/data/mockData'

export default function LocationSwitcher() {
  const { role, locationId, setLocation } = useApp()
  const caps = capabilitiesForRole(role)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const canSwitch = caps.switchLocations
  const options = [
    ...(caps.allLocations ? [{ id: ALL_LOCATIONS_ID, name: 'All locations', city: 'Company-wide' }] : []),
    ...LOCATIONS,
  ]
  const active = options.find((o) => o.id === locationId) || LOCATIONS[0]
  const isAll = locationId === ALL_LOCATIONS_ID

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={!canSwitch}
        onClick={() => canSwitch && setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left transition-colors',
          canSwitch && 'hover:bg-white/10',
          !canSwitch && 'cursor-default',
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent/20 text-sidebar-accent">
          {isAll ? <Building2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">{active.name}</span>
          <span className="block truncate text-xs text-sidebar-foreground">{active.city}</span>
        </span>
        {canSwitch && <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-lg border border-border bg-card p-1 shadow-lg animate-fade-in">
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => {
                setLocation(o.id)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent',
                o.id === locationId && 'bg-accent/60',
              )}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-cyan/10 text-brand-cyanText">
                {o.id === ALL_LOCATIONS_ID ? <Building2 className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{o.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{o.city}</span>
              </span>
              {o.id === locationId && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
