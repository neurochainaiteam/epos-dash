import BrandMark from '@/components/BrandMark'

export default function PageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-sidebar-accent/10 ring-1 ring-sidebar-accent/30">
          <BrandMark className="h-9 w-9" />
        </span>
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    </div>
  )
}
