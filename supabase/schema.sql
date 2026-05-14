-- =====================================================================
-- Supabase schema for imageprompting.org
-- Run this once in the Supabase SQL editor.
-- =====================================================================

-- Profiles: 1 row per auth user.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = id);

-- =====================================================================
-- Monthly credit balances. One row per (user, billing_month).
-- billing_month is the YYYY-MM string (UTC). When the month rolls over,
-- a new row is implicitly used (zero balance) until the user buys again.
-- =====================================================================
create table if not exists public.credit_balances (
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_month text not null,           -- e.g. "2026-05"
  credits_remaining integer not null default 0,
  unlimited boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, billing_month)
);

alter table public.credit_balances enable row level security;

drop policy if exists "balances self read" on public.credit_balances;
create policy "balances self read" on public.credit_balances
  for select using (auth.uid() = user_id);

-- Server (service role) writes balances; users cannot.

-- =====================================================================
-- Usage ledger: every generation logs one row. Useful for analytics.
-- =====================================================================
create table if not exists public.usage_events (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_month text not null,
  kind text not null default 'image_to_prompt',
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.usage_events enable row level security;

drop policy if exists "usage self read" on public.usage_events;
create policy "usage self read" on public.usage_events
  for select using (auth.uid() = user_id);

create index if not exists usage_events_user_month_idx
  on public.usage_events (user_id, billing_month);

-- =====================================================================
-- Purchases: one row per successful Stripe checkout. Idempotent on
-- stripe_session_id so webhook retries don't double-credit.
-- =====================================================================
create table if not exists public.purchases (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,                 -- starter | pro | unlimited
  billing_month text not null,
  credits_granted integer not null,
  unlimited boolean not null default false,
  amount_cents integer not null,
  currency text not null default 'usd',
  stripe_session_id text unique,
  stripe_payment_intent text,
  created_at timestamptz not null default now()
);

alter table public.purchases enable row level security;

drop policy if exists "purchases self read" on public.purchases;
create policy "purchases self read" on public.purchases
  for select using (auth.uid() = user_id);

-- =====================================================================
-- Atomic credit consumption. Returns the new remaining count (-1 if no
-- credits and not unlimited). Runs with definer rights so RLS doesn't
-- block the write.
-- =====================================================================
create or replace function public.consume_credit(
  p_user_id uuid,
  p_billing_month text
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining integer;
  v_unlimited boolean;
begin
  select credits_remaining, unlimited
    into v_remaining, v_unlimited
  from public.credit_balances
  where user_id = p_user_id and billing_month = p_billing_month
  for update;

  if not found then
    return -1;
  end if;

  if v_unlimited then
    return 999999;
  end if;

  if v_remaining <= 0 then
    return -1;
  end if;

  update public.credit_balances
    set credits_remaining = credits_remaining - 1,
        updated_at = now()
  where user_id = p_user_id and billing_month = p_billing_month;

  return v_remaining - 1;
end;
$$;

revoke all on function public.consume_credit(uuid, text) from public;
grant execute on function public.consume_credit(uuid, text) to service_role;

-- Refund a single credit (used when a generation fails server-side).
-- No-op on unlimited rows.
create or replace function public.refund_credit(
  p_user_id uuid,
  p_billing_month text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credit_balances
    set credits_remaining = credits_remaining + 1,
        updated_at = now()
  where user_id = p_user_id
    and billing_month = p_billing_month
    and unlimited = false;
end;
$$;

revoke all on function public.refund_credit(uuid, text) from public;
grant execute on function public.refund_credit(uuid, text) to service_role;

-- =====================================================================
-- New user trigger: create a profile + free trial credits on signup.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_month text := to_char((now() at time zone 'utc'), 'YYYY-MM');
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.credit_balances (user_id, billing_month, credits_remaining, unlimited)
  values (new.id, v_month, 2, false)
  on conflict (user_id, billing_month) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- Generation history: one row per successful image-to-prompt run.
-- Image bytes live in the `prompt-images` storage bucket; image_path is
-- the path inside that bucket (e.g. "<user_id>/<generation_id>.png").
-- =====================================================================
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  prompt text not null,
  mode text not null,
  created_at timestamptz not null default now()
);

alter table public.generations enable row level security;

drop policy if exists "generations self read" on public.generations;
create policy "generations self read" on public.generations
  for select using (auth.uid() = user_id);

drop policy if exists "generations self delete" on public.generations;
create policy "generations self delete" on public.generations
  for delete using (auth.uid() = user_id);

create index if not exists generations_user_created_idx
  on public.generations (user_id, created_at desc);

-- =====================================================================
-- Private storage bucket for source images.
-- 30 MB per-file limit, restricted to common image MIME types.
-- The browser uploads directly here via signed upload URLs minted by
-- /api/upload-url, so big images never traverse the Next.js function.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'prompt-images',
  'prompt-images',
  false,
  31457280, -- 30 * 1024 * 1024
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = excluded.public;

-- Allow users to read their own folder via the signed-URL endpoint or
-- the authenticated REST API (path convention: <user_id>/<file>).
drop policy if exists "users read own images" on storage.objects;
create policy "users read own images" on storage.objects
  for select using (
    bucket_id = 'prompt-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
