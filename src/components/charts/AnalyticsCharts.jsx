import {
  Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
  CartesianGrid, Cell,
} from 'recharts'
import { gbp, pct } from '@/lib/utils'
import { CHART } from '@/config/theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Lazy-loaded as one module so the whole recharts dependency is deferred until
// after the Analytics page shell (summary cards) has painted.
const TEAL = CHART.cyan
const AXIS = { fontSize: 11, fill: CHART.axis }
const GRID = CHART.grid

function Box({ children, label }) {
  if (!children?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {children}
    </div>
  )
}

export default function AnalyticsCharts({ byHour, byDay, bestSellers, labourTrend, peakHour }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Busiest times */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Busiest times of day</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byHour} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={AXIS} interval={1} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `£${v}`} />
              <Tooltip cursor={{ fill: CHART.cursor }} content={({ active, payload, label }) => active && payload?.length ? <Box label={label}><div className="text-sm font-semibold">{gbp(payload[0].value)}</div></Box> : null} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {byHour.map((e, i) => <Cell key={i} fill={e.hour === peakHour.hour ? TEAL : CHART.cyanSoft} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales by day */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Sales by day (last 7 days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `£${v}`} />
              <Tooltip cursor={{ fill: CHART.cursor }} content={({ active, payload, label }) => active && payload?.length ? <Box label={label}><div className="text-sm font-semibold">{gbp(payload[0].value)}</div></Box> : null} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill={TEAL} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Best sellers */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Best sellers (by revenue)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart layout="vertical" data={bestSellers} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={GRID} />
              <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `£${v}`} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 10 }} width={120} />
              <Tooltip cursor={{ fill: CHART.cursor }} content={({ active, payload, label }) => active && payload?.length ? <Box label={label}><div className="text-sm font-semibold">{gbp(payload[0].value)} · {payload[0].payload.qty} sold</div></Box> : null} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} fill={TEAL} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Labour & food cost % */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Labour &amp; food cost % of revenue</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={labourTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={(v) => `${Math.round(v)}%`} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <Box label={label}>
                  {payload.map((p) => <div key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>{p.dataKey === 'labourPct' ? 'Labour' : 'Food'} {pct(p.value)}</div>)}
                </Box>
              ) : null} />
              <Line type="monotone" dataKey="labourPct" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="foodPct" stroke={CHART.magenta} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TEAL }} /> Labour %</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: CHART.magenta }} /> Food cost %</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
