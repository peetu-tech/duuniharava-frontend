create table if not exists public.studio_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_state enable row level security;

create policy "Users can view own studio state"
on public.studio_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own studio state"
on public.studio_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own studio state"
on public.studio_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own studio state"
on public.studio_state
for delete
to authenticated
using (auth.uid() = user_id);
