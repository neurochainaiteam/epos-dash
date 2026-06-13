import { ShieldCheck, RotateCcw, Lock, Check } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import {
  PAGES, ROLES, ROLE_META, EDITABLE_ROLES, isPageAllowedForRole,
} from '@/config/roles'
import { cn } from '@/lib/utils'
import PageHeader from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const ROLE_ORDER = [ROLES.STAFF, ROLES.MANAGER, ROLES.DIRECTOR]

function Switch({ checked, disabled, locked, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={checked}
      className={cn(
        'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
        checked ? 'bg-brand-gradient' : 'bg-muted',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90',
      )}
      title={locked ? 'Always on for this role' : disabled ? 'Not available to this role' : 'Toggle access'}
    >
      <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white shadow transition', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}

export default function Permissions() {
  const { canAccessAs, setPermission, resetPermissions } = useApp()

  return (
    <div>
      <PageHeader title="User Permissions" description="Control which pages each role can see — changes apply live across the app">
        <Badge variant="accent" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Director control</Badge>
        <Button size="sm" variant="outline" onClick={resetPermissions}><RotateCcw className="h-3.5 w-3.5" /> Reset to defaults</Button>
      </PageHeader>

      <div className="space-y-5 p-5 sm:p-8">
        {/* Role summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          {ROLE_ORDER.map((r) => {
            const count = PAGES.filter((p) => canAccessAs(r, p.key)).length
            return (
              <Card key={r} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-[#E1E1E1]">{ROLE_META[r].label}</div>
                  {!EDITABLE_ROLES.includes(r) && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{ROLE_META[r].blurb}</p>
                <div className="mt-2 text-lg font-bold tabular-nums text-brand-cyan">{count} <span className="text-xs font-normal text-muted-foreground">pages</span></div>
              </Card>
            )
          })}
        </div>

        {/* Matrix */}
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Page</th>
                  {ROLE_ORDER.map((r) => (
                    <th key={r} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {ROLE_META[r].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAGES.map((p) => (
                  <tr key={p.key} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-[#E1E1E1]">{p.label}</div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{p.group}</div>
                    </td>
                    {ROLE_ORDER.map((r) => {
                      const allowed = canAccessAs(r, p.key)
                      const editable = EDITABLE_ROLES.includes(r) && isPageAllowedForRole(r, p.key)
                      const directorLocked = r === ROLES.DIRECTOR
                      const eligible = isPageAllowedForRole(r, p.key)
                      return (
                        <td key={r} className="px-4 py-2.5 text-center">
                          <div className="flex justify-center">
                            <Switch
                              checked={allowed}
                              disabled={!editable}
                              locked={directorLocked}
                              onClick={() => editable && setPermission(r, p.key, !allowed)}
                            />
                          </div>
                          {!eligible && <div className="mt-0.5 text-[10px] text-muted-foreground">n/a</div>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="flex items-start gap-2 rounded-lg border border-brand-cyan/20 bg-brand-cyan/5 p-3 text-sm text-muted-foreground">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />
          <span>
            Toggles are driven from the central roles config. Director access is structural and can’t be edited away.
            Staff and Manager rows can be granted any page within their tier — changes update the sidebar and route guards immediately.
          </span>
        </div>
      </div>
    </div>
  )
}
