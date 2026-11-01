-- ============================================================================
-- UtsavAI — PostgreSQL Database Schema & Row Level Security (RLS)
-- Migration: 001_initial_schema.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Celebration Host',
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. EVENTS
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  event_type text not null,
  description text not null default '',
  event_date date not null,
  location text not null,
  guest_target integer not null check (guest_target > 0),
  total_budget_minor bigint not null check (total_budget_minor >= 0),
  currency text not null default 'INR',
  theme text not null default 'Modern Celebration',
  preferences_json jsonb not null default '{}'::jsonb,
  status text not null default 'planning' check (status in ('draft', 'planning', 'confirmed', 'completed', 'cancelled')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_events_owner_id on public.events(owner_id);
create index if not exists idx_events_event_date on public.events(event_date);

-- 3. EVENT PLANS
create table if not exists public.event_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  version integer not null default 1,
  overview_json jsonb not null default '{}'::jsonb,
  theme_json jsonb not null default '{}'::jsonb,
  itinerary_json jsonb not null default '[]'::jsonb,
  recommendations_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_plans_event_id on public.event_plans(event_id);

-- 4. BUDGET CATEGORIES
create table if not exists public.budget_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  allocated_amount_minor bigint not null default 0 check (allocated_amount_minor >= 0),
  estimated_amount_minor bigint not null default 0 check (estimated_amount_minor >= 0),
  notes text default '',
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_budget_categories_event_id on public.budget_categories(event_id);

-- 5. VENDORS
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  category text not null,
  contact_name text default '',
  phone text default '',
  email text default '',
  website text default '',
  quoted_amount_minor bigint not null default 0 check (quoted_amount_minor >= 0),
  booking_status text not null default 'Not Contacted'
    check (booking_status in ('Not Contacted', 'Contacted', 'Quote Received', 'Shortlisted', 'Booked', 'Cancelled')),
  payment_status text not null default 'Unpaid'
    check (payment_status in ('Unpaid', 'Deposit Paid', 'Partially Paid', 'Paid in Full', 'Refunded')),
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  deadline date,
  notes text default '',
  is_sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vendors_event_id on public.vendors(event_id);

-- 6. EXPENSES
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category_id uuid references public.budget_categories(id) on delete set null,
  vendor_id uuid references public.vendors(id) on delete set null,
  title text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  cost_type text not null default 'confirmed' check (cost_type in ('ai_estimate', 'quote', 'confirmed')),
  payment_status text not null default 'Pending'
    check (payment_status in ('Pending', 'Deposit Paid', 'Paid', 'Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_expenses_event_id on public.expenses(event_id);
create index if not exists idx_expenses_category_id on public.expenses(category_id);

-- 7. TASKS
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  description text default '',
  due_date date not null,
  priority text not null default 'Medium' check (priority in ('High', 'Medium', 'Low')),
  status text not null default 'Todo' check (status in ('Todo', 'In Progress', 'Completed')),
  category text not null default 'General',
  phase text not null default 'Pre-Event',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_event_id on public.tasks(event_id);
create index if not exists idx_tasks_due_date on public.tasks(due_date);

-- 8. GUESTS
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  contact text default '',
  guest_group text not null default 'Friends',
  rsvp_status text not null default 'Invited'
    check (rsvp_status in ('Invited', 'Confirmed', 'Declined', 'Maybe', 'Not Responded')),
  dietary_preferences text default 'None',
  plus_ones integer not null default 0 check (plus_ones >= 0),
  accessibility_notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_guests_event_id on public.guests(event_id);

-- 9. AI CONVERSATIONS
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_conversations_event_id on public.ai_conversations(event_id);

-- 10. AI MESSAGES
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  proposal_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_messages_conversation_id on public.ai_messages(conversation_id);

-- 11. CHANGE PROPOSALS (With optimistic concurrency control via base_version)
create table if not exists public.change_proposals (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  requested_change text not null,
  changes_json jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected', 'stale')),
  base_version integer not null default 1,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create index if not exists idx_change_proposals_event_id on public.change_proposals(event_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_plans enable row level security;
alter table public.budget_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.vendors enable row level security;
alter table public.tasks enable row level security;
alter table public.guests enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.change_proposals enable row level security;

-- Helper function to check event ownership
create or replace function public.owns_event(target_event_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.events
    where id = target_event_id and owner_id = auth.uid()
  );
$$;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (id = auth.uid());
create policy "Users can update own profile" on public.profiles
  for update using (id = auth.uid());
create policy "Users can insert own profile" on public.profiles
  for insert with check (id = auth.uid());

-- Events policies
create policy "Users can select own events" on public.events
  for select using (owner_id = auth.uid());
create policy "Users can insert own events" on public.events
  for insert with check (owner_id = auth.uid());
create policy "Users can update own events" on public.events
  for update using (owner_id = auth.uid());
create policy "Users can delete own events" on public.events
  for delete using (owner_id = auth.uid());

-- Child tables protected via public.owns_event(event_id)
create policy "Owner access event_plans" on public.event_plans
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access budget_categories" on public.budget_categories
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access expenses" on public.expenses
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access vendors" on public.vendors
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access tasks" on public.tasks
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access guests" on public.guests
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access ai_conversations" on public.ai_conversations
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));

create policy "Owner access ai_messages" on public.ai_messages
  for all using (
    exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and public.owns_event(c.event_id)
    )
  );

create policy "Owner access change_proposals" on public.change_proposals
  for all using (public.owns_event(event_id)) with check (public.owns_event(event_id));
