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

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 2026-09-28: research tables for the feedback-positioning experiment
--
-- These three tables exist to learn who is using OnCue and why. They are
-- INSERT-ONLY for the public anon key: there is deliberately no select policy,
-- because the browser key is public and these rows contain email addresses.
-- Read them from the Supabase dashboard or with the service role key only.
-- ─────────────────────────────────────────────────────────────────────────────

-- Optional email capture, offered only after a share link has been created.
create table if not exists email_captures (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) between 3 and 254 and position('@' in email) > 1),
  project_id uuid references projects(id) on delete set null,
  -- Anonymous localStorage id. Not a fingerprint: random, self-assigned,
  -- cleared whenever the visitor clears site data.
  creator_id text,
  source text not null default 'post_share',
  use_case text,
  -- "Email me this link" is NOT marketing consent. This is a separate,
  -- unchecked-by-default opt-in for being contacted about OnCue.
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now()
);

-- "What are you using OnCue for?" — asked after the first share, never before.
create table if not exists use_case_responses (
  id uuid primary key default gen_random_uuid(),
  creator_id text not null,
  use_case text not null,
  project_id uuid references projects(id) on delete set null,
  created_at timestamptz not null default now()
);

-- "What's missing from OnCue?" — open text, optional email.
create table if not exists product_feedback (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 1 and 4000),
  email text,
  creator_id text,
  use_case text,
  path text,
  created_at timestamptz not null default now()
);

alter table email_captures enable row level security;
alter table use_case_responses enable row level security;
alter table product_feedback enable row level security;

-- Insert-only. No select policy on purpose (see note above).
create policy "Anyone can submit an email capture" on email_captures for insert with check (true);
create policy "Anyone can submit a use case" on use_case_responses for insert with check (true);
create policy "Anyone can submit feedback" on product_feedback for insert with check (true);
