-- =============================================================================
-- EPOS Dashboard — Supabase Schema
-- Run this entire file in Supabase → SQL Editor → New query
-- =============================================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";


-- =============================================================================
-- PROFILES (linked to Supabase auth.users)
-- =============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('staff', 'manager', 'director')),
  name        text not null,
  job_title   text not null default '',
  location_id text,                    -- null = all locations (director)
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile; directors can read all.
create policy "profiles: own read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: director read all"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );

-- Trigger: auto-create a blank profile row when a user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, role, name, job_title)
  values (new.id, 'staff', coalesce(new.raw_user_meta_data->>'name', new.email), '');
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =============================================================================
-- LOCATIONS
-- =============================================================================
create table if not exists public.locations (
  id         text primary key,          -- 'bham' | 'leic' | 'cov'
  name       text not null,
  city       text not null,
  address    text not null default '',
  cuisine    text not null default '',
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
create policy "locations: authenticated read"
  on public.locations for select to authenticated using (true);


-- =============================================================================
-- DAILY SNAPSHOTS  (today's KPIs per location)
-- =============================================================================
create table if not exists public.daily_snapshots (
  id               uuid primary key default gen_random_uuid(),
  location_id      text not null references public.locations(id),
  date             date not null default current_date,
  revenue          numeric(10,2) not null default 0,
  cogs             numeric(10,2) not null default 0,
  labour           numeric(10,2) not null default 0,
  overheads        numeric(10,2) not null default 0,
  order_count      int not null default 0,
  revenue_delta    numeric(6,2) default 0,   -- % vs prior day
  cogs_delta       numeric(6,2) default 0,
  labour_delta     numeric(6,2) default 0,
  overheads_delta  numeric(6,2) default 0,
  net_profit_delta numeric(6,2) default 0,
  order_count_delta numeric(6,2) default 0,
  created_at       timestamptz not null default now(),
  unique (location_id, date)
);

alter table public.daily_snapshots enable row level security;
create policy "daily_snapshots: authenticated read"
  on public.daily_snapshots for select to authenticated using (true);
create policy "daily_snapshots: manager+ write"
  on public.daily_snapshots for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- HOURLY REVENUE  (intraday shape for the chart)
-- =============================================================================
create table if not exists public.hourly_revenue (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  date        date not null default current_date,
  hour        text not null,            -- '11:00' … '23:00'
  revenue     numeric(10,2) not null default 0,
  orders      int not null default 0,
  created_at  timestamptz not null default now(),
  unique (location_id, date, hour)
);

alter table public.hourly_revenue enable row level security;
create policy "hourly_revenue: authenticated read"
  on public.hourly_revenue for select to authenticated using (true);


-- =============================================================================
-- DAILY REVENUE SERIES  (7-day rolling window per location)
-- =============================================================================
create table if not exists public.daily_revenue_series (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  date        date not null,
  day_label   text not null,            -- 'Mon' … 'Sun'
  revenue     numeric(10,2) not null default 0,
  cogs        numeric(10,2) not null default 0,
  labour      numeric(10,2) not null default 0,
  created_at  timestamptz not null default now(),
  unique (location_id, date)
);

alter table public.daily_revenue_series enable row level security;
create policy "daily_revenue_series: authenticated read"
  on public.daily_revenue_series for select to authenticated using (true);


-- =============================================================================
-- ORDERS
-- =============================================================================
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  reference   text not null,            -- display ID e.g. '#10248'
  date        date not null default current_date,
  time        time not null,
  items       text not null default '',
  qty         int not null default 1,
  total       numeric(8,2) not null default 0,
  payment     text not null check (payment in ('Card', 'Cash')),
  channel     text not null default 'In-store',
  created_at  timestamptz not null default now()
);

alter table public.orders enable row level security;
create policy "orders: authenticated read"
  on public.orders for select to authenticated using (true);
create policy "orders: staff+ insert"
  on public.orders for insert to authenticated with check (true);


-- =============================================================================
-- BEST SELLERS
-- =============================================================================
create table if not exists public.best_sellers (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  date        date not null default current_date,
  name        text not null,
  qty         int not null default 0,
  revenue     numeric(10,2) not null default 0,
  rank        int not null default 1,
  created_at  timestamptz not null default now(),
  unique (location_id, date, name)
);

alter table public.best_sellers enable row level security;
create policy "best_sellers: authenticated read"
  on public.best_sellers for select to authenticated using (true);


-- =============================================================================
-- INVENTORY ITEMS
-- =============================================================================
create table if not exists public.inventory_items (
  id            uuid primary key default gen_random_uuid(),
  location_id   text not null references public.locations(id),
  name          text not null,
  unit          text not null default 'each',
  in_stock      numeric(10,3) not null default 0,
  par           numeric(10,3) not null default 0,
  cost          numeric(8,4) not null default 0,
  supplier_name text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (location_id, name)
);

alter table public.inventory_items enable row level security;
create policy "inventory_items: authenticated read"
  on public.inventory_items for select to authenticated using (true);
create policy "inventory_items: manager+ write"
  on public.inventory_items for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- RECIPES
-- =============================================================================
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  location_id  text not null references public.locations(id),
  dish         text not null,
  price        numeric(8,2) not null default 0,
  portion_cost numeric(8,2) not null default 0,
  ingredients  text[] not null default '{}',
  created_at   timestamptz not null default now(),
  unique (location_id, dish)
);

alter table public.recipes enable row level security;
create policy "recipes: authenticated read"
  on public.recipes for select to authenticated using (true);
create policy "recipes: manager+ write"
  on public.recipes for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- WASTE LOG
-- =============================================================================
create table if not exists public.waste_log (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  date        date not null default current_date,
  item        text not null,
  qty         text not null default '',       -- e.g. '8 each', '0.8 kg'
  reason      text not null default '',
  cost        numeric(8,2) not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.waste_log enable row level security;
create policy "waste_log: authenticated read"
  on public.waste_log for select to authenticated using (true);
create policy "waste_log: staff+ insert"
  on public.waste_log for insert to authenticated with check (true);


-- =============================================================================
-- STAFF MEMBERS
-- =============================================================================
create table if not exists public.staff_members (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  name        text not null,
  role        text not null,
  wage        numeric(6,2) not null default 0,
  contract    text not null check (contract in ('Full-time', 'Part-time')),
  shifts      jsonb not null default '{}',    -- { Mon: null | '16:00–23:00', … }
  created_at  timestamptz not null default now()
);

alter table public.staff_members enable row level security;
create policy "staff_members: authenticated read"
  on public.staff_members for select to authenticated using (true);
create policy "staff_members: manager+ write"
  on public.staff_members for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- BOOKINGS
-- =============================================================================
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  date        date not null default current_date,
  time        time not null,
  name        text not null,
  size        int not null default 1,
  table_ref   text not null default '',
  phone       text not null default '',
  status      text not null check (status in ('Confirmed', 'Seated', 'Pending', 'Cancelled')),
  created_at  timestamptz not null default now()
);

alter table public.bookings enable row level security;
create policy "bookings: authenticated read"
  on public.bookings for select to authenticated using (true);
create policy "bookings: staff+ write"
  on public.bookings for all to authenticated with check (true);


-- =============================================================================
-- CHECKLIST COMPLETIONS  (history)
-- =============================================================================
create table if not exists public.checklist_completions (
  id           uuid primary key default gen_random_uuid(),
  location_id  text not null references public.locations(id),
  date         date not null,
  section      text not null,
  completed_by text not null,
  completed_at text not null default '',   -- e.g. '08:12'
  done         int not null default 0,
  total        int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.checklist_completions enable row level security;
create policy "checklist_completions: authenticated read"
  on public.checklist_completions for select to authenticated using (true);
create policy "checklist_completions: staff+ insert"
  on public.checklist_completions for insert to authenticated with check (true);


-- =============================================================================
-- CHECKLIST SCHEDULES
-- =============================================================================
create table if not exists public.checklist_schedules (
  id            uuid primary key default gen_random_uuid(),
  section       text not null unique,
  recurrence    text not null default 'Daily',
  reminder      text not null default '08:00',
  day           text,
  assigned_role text not null default 'Manager',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.checklist_schedules enable row level security;
create policy "checklist_schedules: authenticated read"
  on public.checklist_schedules for select to authenticated using (true);
create policy "checklist_schedules: manager+ write"
  on public.checklist_schedules for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- EXPENSES
-- =============================================================================
create table if not exists public.expenses (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  reference   text not null default '',       -- display ID e.g. 'EXP-101'
  date        date not null,
  category    text not null,
  vendor      text not null default '',
  amount      numeric(10,2) not null default 0,
  note        text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.expenses enable row level security;
create policy "expenses: manager+ read"
  on public.expenses for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
create policy "expenses: director write"
  on public.expenses for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );


-- =============================================================================
-- TIME OFF
-- =============================================================================
create table if not exists public.time_off (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  staff_name  text not null,
  role        text not null default '',
  type        text not null check (type in ('Holiday', 'Sick', 'Unpaid', 'Training')),
  status      text not null check (status in ('Approved', 'Pending', 'Declined')),
  label       text not null default '',
  week_days   text[] not null default '{}',
  days        int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.time_off enable row level security;
create policy "time_off: authenticated read"
  on public.time_off for select to authenticated using (true);
create policy "time_off: staff+ insert"
  on public.time_off for insert to authenticated with check (true);
create policy "time_off: manager+ update"
  on public.time_off for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- SMS CAMPAIGNS
-- =============================================================================
create table if not exists public.sms_campaigns (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  reference   text not null default '',       -- display ID e.g. 'C-301'
  name        text not null,
  date        date not null,
  audience    text not null default '',
  sent        int not null default 0,
  delivered   int not null default 0,
  opened      int not null default 0,
  redeemed    int not null default 0,
  status      text not null check (status in ('Draft', 'Scheduled', 'Sending', 'Completed')),
  message     text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.sms_campaigns enable row level security;
create policy "sms_campaigns: manager+ read"
  on public.sms_campaigns for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
create policy "sms_campaigns: manager+ write"
  on public.sms_campaigns for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- CALL LOG
-- =============================================================================
create table if not exists public.call_log (
  id           uuid primary key default gen_random_uuid(),
  location_id  text not null references public.locations(id),
  date         date not null default current_date,
  time         time not null,
  number       text not null,
  caller_name  text not null default '',
  duration_sec int not null default 0,
  outcome      text not null check (outcome in ('Answered', 'Missed', 'Voicemail')),
  type         text not null default '',
  created_at   timestamptz not null default now()
);

alter table public.call_log enable row level security;
create policy "call_log: manager+ read"
  on public.call_log for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- PLATFORM ACCOUNTS  (delivery integrations)
-- =============================================================================
create table if not exists public.platform_accounts (
  id           uuid primary key default gen_random_uuid(),
  location_id  text not null references public.locations(id),
  platform     text not null,
  account_name text not null default '',
  store_id     text not null default '',
  status       text not null check (status in ('Connected', 'Action needed', 'Not connected')),
  orders_today int not null default 0,
  last_sync    text not null default 'Never synced',
  created_at   timestamptz not null default now()
);

alter table public.platform_accounts enable row level security;
create policy "platform_accounts: manager+ read"
  on public.platform_accounts for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
create policy "platform_accounts: director write"
  on public.platform_accounts for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );


-- =============================================================================
-- SUPPLIERS
-- =============================================================================
create table if not exists public.suppliers (
  name        text primary key,
  email       text not null default '',
  phone       text not null default '',
  lead_days   int not null default 3,
  account_ref text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.suppliers enable row level security;
create policy "suppliers: authenticated read"
  on public.suppliers for select to authenticated using (true);


-- =============================================================================
-- INGREDIENT PRICE HISTORY
-- =============================================================================
create table if not exists public.ingredient_price_history (
  id            uuid primary key default gen_random_uuid(),
  location_id   text not null references public.locations(id),
  item_name     text not null,
  period        text not null,             -- e.g. 'Feb 2026'
  cost          numeric(8,4) not null default 0,
  supplier_name text not null default '',
  source        text not null default '',
  created_at    timestamptz not null default now()
);

alter table public.ingredient_price_history enable row level security;
create policy "ingredient_price_history: manager+ read"
  on public.ingredient_price_history for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
create policy "ingredient_price_history: manager+ write"
  on public.ingredient_price_history for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- RECEIPTS  (scanned via OCR)
-- =============================================================================
create table if not exists public.receipts (
  id            uuid primary key default gen_random_uuid(),
  location_id   text not null references public.locations(id),
  reference     text not null default '',
  supplier_name text not null default '',
  date_label    text not null default '',
  currency      text not null default 'GBP',
  total         numeric(10,2) not null default 0,
  engine        text not null default '',
  lines         jsonb not null default '[]',
  created_at    timestamptz not null default now()
);

alter table public.receipts enable row level security;
create policy "receipts: manager+ read"
  on public.receipts for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
create policy "receipts: manager+ insert"
  on public.receipts for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );


-- =============================================================================
-- PERMISSION OVERRIDES  (Director-editable, layered over defaults in roles.js)
-- =============================================================================
create table if not exists public.permission_overrides (
  id        uuid primary key default gen_random_uuid(),
  role      text not null check (role in ('staff', 'manager')),
  page_key  text not null,
  allowed   boolean not null,
  created_at timestamptz not null default now(),
  unique (role, page_key)
);

alter table public.permission_overrides enable row level security;
create policy "permission_overrides: director read"
  on public.permission_overrides for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );
create policy "permission_overrides: director write"
  on public.permission_overrides for all to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'director'
    )
  );


-- =============================================================================
-- ADVISOR DATA  (ingredient trends, order modifiers, clock-ins, holidays)
-- =============================================================================
create table if not exists public.ingredient_trends (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  name        text not null,
  old_cost    numeric(8,4) not null default 0,
  new_cost    numeric(8,4) not null default 0,
  unit        text not null default '',
  used_in     text not null default '',
  created_at  timestamptz not null default now()
);

alter table public.ingredient_trends enable row level security;
create policy "ingredient_trends: manager+ read"
  on public.ingredient_trends for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );

create table if not exists public.order_modifiers (
  id              uuid primary key default gen_random_uuid(),
  location_id     text not null references public.locations(id),
  base_item       text not null,
  addon           text not null default '',
  count           int not null default 0,
  suggestion      text not null default '',
  suggested_price numeric(8,2) not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.order_modifiers enable row level security;
create policy "order_modifiers: manager+ read"
  on public.order_modifiers for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );

create table if not exists public.clock_ins (
  id            uuid primary key default gen_random_uuid(),
  location_id   text not null references public.locations(id),
  staff_name    text not null,
  role          text not null default '',
  late_count    int not null default 0,
  avg_late_mins int not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.clock_ins enable row level security;
create policy "clock_ins: manager+ read"
  on public.clock_ins for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );

create table if not exists public.holidays (
  id          uuid primary key default gen_random_uuid(),
  location_id text not null references public.locations(id),
  staff_name  text not null,
  role        text not null default '',
  start_date  text not null default '',   -- kept as text to match mock 'dd Mon' format
  end_date    text not null default '',
  weeks       int not null default 1,
  created_at  timestamptz not null default now()
);

alter table public.holidays enable row level security;
create policy "holidays: manager+ read"
  on public.holidays for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('manager', 'director')
    )
  );
