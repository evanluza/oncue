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

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 2026-10-24 (step 2a): read a share page through one function
--
-- The share page read `projects` and `annotations` directly, which needed anon
-- SELECT on both tables. Anyone holding the public anon key could therefore
-- list every project and harvest every audio_url — the unguessable share UUID
-- was irrelevant, because the index itself was readable.
--
-- get_project() returns exactly one project and its notes, so the anon SELECT
-- policies can be dropped (step 2b, below) without breaking share links.
--
-- SECURITY DEFINER runs it as the owner, past RLS; `set search_path` is
-- mandatory with that, or the body can be hijacked via a shadowed table name.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.get_project(id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'project', to_jsonb(p),
    'annotations', coalesce((
      select jsonb_agg(to_jsonb(a) order by a.timestamp)
      from public.annotations a
      where a.project_id = p.id
    ), '[]'::jsonb)
  )
  from public.projects p
  where p.id = get_project.id;
$$;

-- The function is the only way in; the tables behind it stay unreachable.
revoke all on function public.get_project(uuid) from public;
grant execute on function public.get_project(uuid) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 2026-10-24 (step 3a): note ownership without accounts
--
-- Anyone holding the public anon key could edit or delete ANY note on ANY
-- project. A note is now editable only by whoever holds its edit token: the
-- token lives in the author's localStorage and only its SHA-256 hash is
-- stored, so the database holds nothing that grants edit rights.
--
-- get_project() strips edit_token_hash — without that, every reader would be
-- handed the value that proves ownership.
--
-- The 927 notes written before this have no token and are read-only for
-- everyone, which is strictly safer than the state they were in.
-- ─────────────────────────────────────────────────────────────────────────────
-- ── 1. Where the hash lives ────────────────────────────────────────────────
alter table public.annotations add column if not exists edit_token_hash text;

-- ── 2. Stop get_project leaking the hash ───────────────────────────────────
-- to_jsonb(a) would now include edit_token_hash, handing every reader the
-- value that proves ownership. Strip it.
create or replace function public.get_project(id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'project', to_jsonb(p),
    'annotations', coalesce((
      select jsonb_agg((to_jsonb(a) - 'edit_token_hash') order by a.timestamp)
      from public.annotations a
      where a.project_id = p.id
    ), '[]'::jsonb)
  )
  from public.projects p
  where p.id = get_project.id;
$$;

-- ── 3. Insert: requires a real project, caps the text ──────────────────────
create or replace function public.add_annotation(
  p_project_id       uuid,
  p_timestamp        double precision,
  p_text             text,
  p_type             text,
  p_contributor_name text,
  p_contributor_color text,
  p_edit_token_hash  text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id uuid;
begin
  -- A note may only hang off a project that exists.
  if not exists (select 1 from public.projects where id = p_project_id) then
    raise exception 'unknown project';
  end if;

  -- Matches NOTE_MAX_LENGTH in components/note-body.tsx. The column is `text`,
  -- so without this an anonymous caller could insert a megabyte per note.
  if p_text is null or char_length(p_text) > 500 then
    raise exception 'invalid note text';
  end if;

  if p_timestamp is null or p_timestamp < 0 then
    raise exception 'invalid timestamp';
  end if;

  insert into public.annotations (
    project_id, timestamp, text, type,
    contributor_name, contributor_color, edit_token_hash
  ) values (
    p_project_id,
    p_timestamp,
    p_text,
    p_type,
    coalesce(nullif(p_contributor_name, ''), 'Anonymous'),
    coalesce(nullif(p_contributor_color, ''), '#F4845F'),
    p_edit_token_hash
  )
  returning id into new_id;

  return new_id;
end;
$$;

-- ── 4. Update: only the token holder ───────────────────────────────────────
-- sha256() is core Postgres (11+), so there's no pgcrypto dependency.
create or replace function public.update_annotation(
  p_id         uuid,
  p_text       text,
  p_edit_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_text is null or char_length(p_text) > 500 then
    raise exception 'invalid note text';
  end if;

  update public.annotations
     set text = p_text
   where id = p_id
     -- `is not null` matters: notes written before this migration have no
     -- token, and must not be editable by passing a null token.
     and edit_token_hash is not null
     and edit_token_hash = encode(sha256(convert_to(p_edit_token, 'utf8')), 'hex');

  return found;
end;
$$;

-- ── 5. Delete: only the token holder ───────────────────────────────────────
create or replace function public.delete_annotation(
  p_id         uuid,
  p_edit_token text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.annotations
   where id = p_id
     and edit_token_hash is not null
     and edit_token_hash = encode(sha256(convert_to(p_edit_token, 'utf8')), 'hex');

  return found;
end;
$$;

-- ── 6. The functions are the only way in ───────────────────────────────────
revoke all on function public.add_annotation(uuid, double precision, text, text, text, text, text) from public;
revoke all on function public.update_annotation(uuid, text, text) from public;
revoke all on function public.delete_annotation(uuid, text) from public;

grant execute on function public.add_annotation(uuid, double precision, text, text, text, text, text) to anon, authenticated;
grant execute on function public.update_annotation(uuid, text, text) to anon, authenticated;
grant execute on function public.delete_annotation(uuid, text) to anon, authenticated;



-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 2026-10-24 (step 4a): record the new object layout
--
-- The browser used to upload straight into the `audio` bucket with the public
-- anon key, so anyone reading the JS bundle could write arbitrary objects.
-- Uploads now go through /api/upload-url, which validates type and size with
-- the service role and returns a one-shot signed URL for
-- {project_id}/{uuid}.{ext}.
--
-- Existing rows keep audio_url and their flat object keys — nothing is moved or
-- renamed. Readers prefer storage_path when set (db.audioUrlFor) and fall back
-- to audio_url, so the 86 older rows are untouched.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.projects add column if not exists storage_path text;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 2026-10-24 (step 5): stored waveform peaks
--
-- A share page downloaded the whole audio file twice on every view: once via
-- fetch() to decode it for the waveform, and again as the <audio> source. At a
-- 4.2MB median file against 5GB monthly egress that is a few hundred views.
--
-- Peaks are now computed in the uploader's browser, where the decoded buffer
-- already exists, and stored here. A share page draws from a few KB of JSON
-- and doesn't touch the audio until someone presses play.
--
-- Projects from before this have peaks null and still decode client-side.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.projects add column if not exists peaks jsonb;
