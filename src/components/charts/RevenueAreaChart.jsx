import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { gbp } from '@/lib/utils'
import { CHART } from '@/config/theme'

// Lazy-loaded on the Dashboard so recharts is NOT part of the initial paint.
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold text-foreground">{gbp(payload[0].value)}</div>
      <div className="text-xs text-muted-foreground">{payload[0].payload.orders} orders</div>
    </div>
  )
}

export default function RevenueAreaChart({ data, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART.cyan} stopOpacity={0.4} />
            <stop offset="100%" stopColor={CHART.cyan} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART.grid} />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} interval={1} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: CHART.axis }} tickFormatter={(v) => `£${v}`} />
        <Tooltip content={<ChartTooltip />} />
        <Area type="monotone" dataKey="revenue" stroke={CHART.cyan} strokeWidth={2.5} fill="url(#revFill)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
