-- Run this SQL in Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

alter table public.bookmarks alter column user_id set default auth.uid();
alter table public.bookmarks drop column if exists saved_by_name;
alter table public.bookmarks enable row level security;
alter table public.bookmarks replica identity full;

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
drop policy if exists "Users can insert own bookmarks" on public.bookmarks;
drop policy if exists "Users can delete own bookmarks" on public.bookmarks;

create policy "Users can read own bookmarks"
on public.bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
on public.bookmarks
for delete
using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bookmarks'
  ) then
    alter publication supabase_realtime add table public.bookmarks;
  end if;
end;
$$;
