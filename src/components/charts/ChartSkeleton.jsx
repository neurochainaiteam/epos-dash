import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder shown while a lazy-loaded chart (and recharts) streams in. */
export default function ChartSkeleton({ height = 240 }) {
  return (
    <div className="flex w-full items-end gap-2 px-2" style={{ height }} aria-hidden>
      {[40, 65, 80, 55, 95, 70, 85, 50, 60, 90, 75, 45].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}
