-- OnCue Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor)

-- Projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audio_url text not null,
  created_by text not null default 'Anonymous',
  creator_color text not null default '#F4845F',
  created_at timestamptz not null default now()
);

-- Annotations table
create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  timestamp float8 not null,
  text text not null default '',
  type text,
  contributor_name text not null default 'Anonymous',
  contributor_color text not null default '#F4845F',
  created_at timestamptz not null default now()
);

-- Index for fast annotation lookups by project
create index if not exists idx_annotations_project_id on annotations(project_id);

-- Enable Row Level Security
alter table projects enable row level security;
alter table annotations enable row level security;

-- Policies: anyone can read (public share links), anyone can insert
-- Projects
create policy "Anyone can view projects" on projects for select using (true);
create policy "Anyone can create projects" on projects for insert with check (true);

-- Annotations
create policy "Anyone can view annotations" on annotations for select using (true);
create policy "Anyone can create annotations" on annotations for insert with check (true);
create policy "Anyone can update their own annotations" on annotations for update using (true);
create policy "Anyone can delete annotations" on annotations for delete using (true);

-- Storage bucket for audio files
insert into storage.buckets (id, name, public) values ('audio', 'audio', true)
on conflict (id) do nothing;

-- Storage policy: anyone can upload and read audio
create policy "Anyone can upload audio" on storage.objects for insert with check (bucket_id = 'audio');
create policy "Anyone can read audio" on storage.objects for select using (bucket_id = 'audio');
