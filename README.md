# NeuroChain Ai — EPOS Operations & P&L Dashboard

Multi-location restaurant operations platform. Dark, futuristic theme (deep-violet/charcoal
surfaces, neon cyan → magenta accents). Backed by **Supabase** (PostgreSQL + Auth).

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

---

## 1. Clone and install

```bash
git clone <your-repo-url>
cd epos-dashboard
npm install
```

---

## 2. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase dashboard under **Project Settings → API**.

> `.env` is git-ignored — never commit it.

---

## 3. Apply the database schema

In the Supabase dashboard, open **SQL Editor → New query**, paste the entire contents of
`supabase/schema.sql`, and click **Run**.

This creates all tables, enables Row Level Security, and installs a trigger that
auto-creates a user profile row on every sign-up.

---

## 4. Seed with mock data

In the same SQL Editor, paste the contents of `supabase/seed.sql` and click **Run**.

This inserts all three locations (Sparkhill, Belgrave, City Centre) plus realistic
stock, staff, orders, expenses, campaigns, and advisor data.
It is **idempotent** — safe to re-run.

---

## 5. Create the first Director account

Director accounts have company-wide access and can manage all locations and permissions.

### Option A — Supabase dashboard

1. Go to **Authentication → Users → Invite user** (or **Add user**).
2. Enter the email and a password.
3. The sign-up trigger creates a profile with `role = staff` automatically.
4. Open **Table Editor → profiles**, find the new row, and set:
   - `role` → `director`
   - `location_id` → leave **null** (Directors see all locations)

### Option B — SQL (run after creating the user via the dashboard)

```sql
-- Replace the UUID with the one shown in Authentication → Users
update public.profiles
set
  role        = 'director',
  name        = 'Your Name',
  job_title   = 'Director',
  location_id = null
where id = 'paste-user-uuid-here';
```

### Creating branch Manager / Staff accounts

Same steps — set `role = 'manager'` or `'staff'` and `location_id` to the branch ID
(`'bham'`, `'leic'`, or `'cov'`).

---

## 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Director credentials.

---

## Roles and access

| Role | Location scope | Sees |
|------|---------------|------|
| **Staff** | Single branch | Orders (view only), Schedule, Checklists |
| **Manager** | Single branch | Everything above + Dashboard, P&L, Inventory, Recipes, Waste, Staff, Bookings, Analytics, Recommendations, Marketing, Integrations |
| **Director** | All locations + company roll-up | All pages + Expenses, Billing, Settings, Permissions |

Directors can also toggle individual page access for Staff and Manager roles from the
**Permissions** page.

---

## Location IDs

| ID | Name | City |
|----|------|------|
| `bham` | Sparkhill | Birmingham |
| `leic` | Belgrave | Leicester |
| `cov` | City Centre | Coventry |

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Public anon key (safe to expose in the client) |

---

## Where things live

```
src/
  context/      AppContext.jsx — auth, location switcher, permissions
  data/         mockData.js   — static config (PLATFORMS, LOCATIONS, PLANS, etc.)
  hooks/        useQuery.js   — data-fetching hook ({ data, loading, error, refetch })
  lib/
    supabase.js               — Supabase client (reads VITE_ env vars)
    db.js                     — all Supabase query and mutation functions
    recommendations.js        — rule-based insights engine
    forecasting.js            — 14-day demand forecasting engine
    utils.js                  — gbp(), cn(), etc.
  pages/        one component per route, lazy-loaded
  components/   shared UI primitives + layout

supabase/
  schema.sql    — tables, RLS policies, trigger
  seed.sql      — mock data as real rows (idempotent)
```

---

## Build for production

```bash
npm run build      # output → dist/
npm run preview    # serve the production build locally
```

Deploy `dist/` to Netlify, Vercel, or any static host. Set the same two `VITE_` env vars
in your hosting provider's dashboard.

---

## Stack

React 18 + Vite · Tailwind CSS · shadcn-style UI primitives · Recharts · Lucide React ·
Supabase (@supabase/supabase-js) · React Router v6
