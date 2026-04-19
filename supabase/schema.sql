create type public.user_role as enum ('admin', 'employee');
create type public.document_category as enum ('manual', 'rule');

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  employee_code text unique,
  full_name text not null,
  department text,
  role public.user_role not null default 'employee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  label text not null,
  published_at date not null default current_date,
  is_published boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category public.document_category not null,
  title text not null,
  summary text not null,
  body text not null,
  search_text text generated always as (
    coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(body, '')
  ) stored,
  is_published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create table if not exists public.document_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists public.document_tag_maps (
  document_id uuid not null references public.documents (id) on delete cascade,
  tag_id uuid not null references public.document_tags (id) on delete cascade,
  primary key (document_id, tag_id)
);

create table if not exists public.document_attachments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text not null default 'application/pdf',
  created_at timestamptz not null default now()
);

create table if not exists public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  keyword text not null,
  synonym text not null,
  unique (keyword, synonym)
);

create table if not exists public.popular_queries (
  id uuid primary key default gen_random_uuid(),
  query text not null unique,
  sort_order integer not null default 100,
  is_active boolean not null default true
);

create index if not exists idx_documents_category on public.documents (category);
create index if not exists idx_documents_updated_at on public.documents (updated_at desc);
create index if not exists idx_announcements_published_at on public.announcements (published_at desc);
create index if not exists idx_search_synonyms_keyword on public.search_synonyms (keyword);

alter table public.profiles enable row level security;
alter table public.announcements enable row level security;
alter table public.documents enable row level security;
alter table public.document_tags enable row level security;
alter table public.document_tag_maps enable row level security;
alter table public.document_attachments enable row level security;
alter table public.search_synonyms enable row level security;
alter table public.popular_queries enable row level security;

create policy "employees can read profiles"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "employees can read announcements"
on public.announcements for select
using (auth.role() = 'authenticated' and is_published = true);

create policy "employees can read documents"
on public.documents for select
using (auth.role() = 'authenticated' and is_published = true);

create policy "employees can read tags"
on public.document_tags for select
using (auth.role() = 'authenticated');

create policy "employees can read tag maps"
on public.document_tag_maps for select
using (auth.role() = 'authenticated');

create policy "employees can read attachments"
on public.document_attachments for select
using (auth.role() = 'authenticated');

create policy "employees can read synonyms"
on public.search_synonyms for select
using (auth.role() = 'authenticated');

create policy "employees can read popular queries"
on public.popular_queries for select
using (auth.role() = 'authenticated' and is_active = true);

create policy "admins can manage announcements"
on public.announcements for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "admins can manage documents"
on public.documents for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
