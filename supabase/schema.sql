-- =====================================================================
-- Поликраище App — Supabase schema
-- Run this once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PROFILES (one row per user, linked to Supabase Auth's auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. POSTS (the "Community" section — user-generated posts)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  image_url text,
  created_at timestamptz not null default now(),
  report_count int not null default 0,
  is_hidden boolean not null default false
);

alter table public.posts enable row level security;

create policy "Visible posts are viewable by everyone"
  on public.posts for select
  using (is_hidden = false);

create policy "Users can insert their own posts"
  on public.posts for insert
  with check (auth.uid() = author_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = author_id);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ---------------------------------------------------------------------
-- 3. POST REPORTS (lightweight moderation: users flag a post)
-- ---------------------------------------------------------------------
create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

alter table public.post_reports enable row level security;

create policy "Users can report a post once"
  on public.post_reports for insert
  with check (auth.uid() = reporter_id);

create policy "Users can see their own reports"
  on public.post_reports for select
  using (auth.uid() = reporter_id);

-- Bump the report_count on the parent post whenever a report is filed,
-- and auto-hide it once it crosses a small threshold pending manual review.
create or replace function public.handle_new_report()
returns trigger as $$
begin
  update public.posts
    set report_count = report_count + 1,
        is_hidden = (report_count + 1) >= 5
    where id = new.post_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_post_reported on public.post_reports;
create trigger on_post_reported
  after insert on public.post_reports
  for each row execute procedure public.handle_new_report();

-- ---------------------------------------------------------------------
-- 4. NEWS ARTICLES (the "News" section — filled by the aggregator script,
--    not by app users; the app only ever reads from this table)
-- ---------------------------------------------------------------------
create table if not exists public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  source text,
  summary text,
  image_url text,
  published_at timestamptz,
  fetched_at timestamptz not null default now()
);

alter table public.news_articles enable row level security;

create policy "News articles are viewable by everyone"
  on public.news_articles for select
  using (true);

-- No insert/update/delete policies for regular users on purpose — only the
-- aggregator script (using the service_role key, which bypasses RLS) writes
-- here.

create index if not exists news_articles_published_at_idx
  on public.news_articles (published_at desc);

-- ---------------------------------------------------------------------
-- 5. STORAGE (bucket for post images)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

create policy "Post images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "Users can delete their own uploaded images"
  on storage.objects for delete
  using (bucket_id = 'post-images' and owner = auth.uid());
