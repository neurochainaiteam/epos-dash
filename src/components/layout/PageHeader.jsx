import { useApp } from '@/context/AppContext'
import { locationName } from '@/data/mockData'
import { Badge } from '@/components/ui/badge'

export default function PageHeader({ title, description, children }) {
  const { locationId } = useApp()
  return (
    <div className="flex flex-col gap-3 border-b bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          <Badge variant="accent" className="hidden sm:inline-flex">{locationName(locationId)}</Badge>
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
