import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { cn } from '@/lib/utils'
import BrandMark from '@/components/BrandMark'

export default function SignIn() {
  const { signIn, landingPath } = useApp()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError(null)
    try {
      const profile = await signIn(email, password)
      // landingPath() reads the role from context — but context updates async.
      // Pass the freshly-returned profile role directly to avoid a race.
      const { landingPageForRole } = await import('@/config/roles')
      navigate(landingPageForRole(profile?.role, {}), { replace: true })
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-sidebar p-8 text-white lg:w-[42%] lg:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-magenta/15 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/15">
            <BrandMark className="h-8 w-8" />
          </span>
          <div>
            <div className="text-lg font-bold tracking-tight">NeuroChain <span className="text-gradient">Ai</span></div>
            <div className="text-xs text-sidebar-foreground">Operations &amp; P&amp;L</div>
          </div>
        </div>

        <div className="relative my-10 max-w-md">
          <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            Every branch, every penny,{' '}
            <span className="text-gradient">in one intelligent place.</span>
          </h1>
          <p className="mt-4 text-sidebar-foreground">
            NeuroChain Ai turns live EPOS sales, labour cost and food margins into clear
            numbers and rule-based recommendations across all your takeaways. Role-based
            access keeps the right insight in front of the right person.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm">
            {['Labour cost %', 'Food cost & margin', 'Net profit', 'Smart recommendations'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sidebar-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-sidebar-foreground/70">
          NeuroChain Ai Group Ltd &copy; {new Date().getFullYear()}
        </div>
      </div>

      {/* Login form panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Sign in to NeuroChain Ai</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your work email and password to access your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={cn(
                  'h-10 w-full rounded-lg border bg-card px-3.5 text-sm text-foreground',
                  'placeholder:text-muted-foreground',
                  'focus:outline-none focus:ring-2 focus:ring-ring',
                  error ? 'border-destructive' : 'border-border',
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'h-10 w-full rounded-lg border bg-card px-3.5 pr-10 text-sm text-foreground',
                    'placeholder:text-muted-foreground',
                    'focus:outline-none focus:ring-2 focus:ring-ring',
                    error ? 'border-destructive' : 'border-border',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all',
                'bg-brand-gradient text-white shadow-sm',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Contact your director or admin if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
