-- =============================================
-- RepCoach UK - Complete Database Setup
-- PART 1: Schema, Tables, Functions, RLS
-- Run this FIRST in Supabase SQL Editor
-- =============================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================
create type user_role as enum ('rep', 'manager', 'admin');
create type call_source as enum ('hubspot', 'manual');
create type call_status as enum ('pending', 'transcribing', 'scoring', 'complete', 'error');
create type practice_status as enum ('active', 'completed', 'abandoned');
create type persona_type as enum ('skeptical_parent', 'price_sensitive', 'engaged_ready', 'spouse_blocker', 'math_hater');

-- =============================================
-- TABLES
-- =============================================

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role user_role default 'rep' not null,
  hubspot_owner_id text,
  avatar_url text,
  aircall_user_id text,
  ringover_user_id text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Scripts table
create table scripts (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  course text not null,
  version integer default 1 not null,
  is_active boolean default true not null,
  content jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Calls table
create table calls (
  id uuid default uuid_generate_v4() primary key,
  rep_id uuid references profiles(id) on delete cascade not null,
  script_id uuid references scripts(id) on delete set null,
  source call_source default 'manual' not null,
  status call_status default 'pending' not null,
  hubspot_call_id text unique,
  hubspot_contact_id text,
  hubspot_deal_id text,
  aircall_call_id text,
  ringover_call_id text,
  recording_url text,
  storage_path text,
  transcript jsonb,
  duration_seconds integer,
  call_date timestamptz not null,
  contact_name text,
  contact_phone text,
  outcome text,
  overall_score numeric(5,2),
  error_message text,
  bookmarks jsonb default '[]'::jsonb,
  summary text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Scores table (using CLOSER/Hormozi phases)
create table scores (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references calls(id) on delete cascade not null,
  phase text not null check (phase in ('opening', 'clarify', 'label', 'overview', 'sell_vacation', 'explain', 'reinforce')),
  score numeric(5,2) not null check (score >= 0 and score <= 100),
  feedback text not null,
  highlights text[] default array[]::text[],
  improvements text[] default array[]::text[],
  quotes jsonb default '[]'::jsonb,
  created_at timestamptz default now() not null,
  unique(call_id, phase)
);

-- Practice sessions table
create table practice_sessions (
  id uuid default uuid_generate_v4() primary key,
  rep_id uuid references profiles(id) on delete cascade not null,
  script_id uuid references scripts(id) on delete set null not null,
  persona persona_type not null,
  status practice_status default 'active' not null,
  messages jsonb default '[]'::jsonb not null,
  final_score numeric(5,2),
  final_feedback text,
  session_state jsonb,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  created_at timestamptz default now() not null
);

-- Call notes table
create table call_notes (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references calls(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  is_flagged boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- HubSpot sync log table
create table hubspot_sync_log (
  id uuid default uuid_generate_v4() primary key,
  sync_type text not null check (sync_type in ('manual', 'cron')),
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  calls_synced integer default 0 not null,
  calls_failed integer default 0 not null,
  error_message text,
  details jsonb
);

-- Aircall sync log table
create table if not exists aircall_sync_log (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (sync_type in ('manual', 'cron')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  calls_synced integer default 0,
  calls_failed integer default 0,
  error_message text,
  details jsonb
);

-- Ringover sync log table
create table if not exists ringover_sync_log (
  id uuid primary key default gen_random_uuid(),
  sync_type text not null check (sync_type in ('manual', 'cron', 'webhook')),
  started_at timestamptz default now(),
  ended_at timestamptz,
  calls_synced integer default 0,
  calls_failed integer default 0,
  error_message text,
  details jsonb
);

-- Practice challenges table
create table if not exists practice_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  created_by uuid not null references profiles(id),
  challenge_type text not null check (challenge_type in ('practice', 'objection_drill')),
  persona text check (persona in ('skeptical_parent', 'price_sensitive', 'engaged_ready', 'spouse_blocker', 'math_hater')),
  scenario_id text,
  target_score integer not null default 70,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text not null default 'active' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Challenge participations table
create table if not exists challenge_participations (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references practice_challenges(id) on delete cascade,
  rep_id uuid not null references profiles(id),
  practice_session_id uuid references practice_sessions(id),
  best_score integer,
  attempts integer default 0,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(challenge_id, rep_id)
);

-- =============================================
-- INDEXES
-- =============================================
create index idx_calls_rep_id on calls(rep_id);
create index idx_calls_call_date on calls(call_date desc);
create index idx_calls_status on calls(status);
create index idx_calls_source on calls(source);
create index idx_calls_hubspot_call_id on calls(hubspot_call_id);
create index idx_scores_call_id on scores(call_id);
create index idx_practice_sessions_rep_id on practice_sessions(rep_id);
create index idx_practice_sessions_status on practice_sessions(status);
create index idx_call_notes_call_id on call_notes(call_id);
create index idx_profiles_hubspot_owner_id on profiles(hubspot_owner_id);
create unique index if not exists calls_aircall_call_id_unique on calls(aircall_call_id) where aircall_call_id is not null;
create index if not exists aircall_sync_log_started_at_idx on aircall_sync_log(started_at desc);
create index if not exists idx_calls_ringover_call_id on calls(ringover_call_id);
create index if not exists idx_profiles_ringover_user_id on profiles(ringover_user_id);
create index if not exists idx_calls_bookmarks on calls using gin (bookmarks);
create index if not exists idx_practice_challenges_status on practice_challenges(status);
create index if not exists idx_practice_challenges_dates on practice_challenges(start_date, end_date);
create index if not exists idx_challenge_participations_challenge on challenge_participations(challenge_id);
create index if not exists idx_challenge_participations_rep on challenge_participations(rep_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table profiles enable row level security;
alter table scripts enable row level security;
alter table calls enable row level security;
alter table scores enable row level security;
alter table practice_sessions enable row level security;
alter table call_notes enable row level security;
alter table hubspot_sync_log enable row level security;
alter table aircall_sync_log enable row level security;
alter table ringover_sync_log enable row level security;
alter table practice_challenges enable row level security;
alter table challenge_participations enable row level security;

-- =============================================
-- RLS POLICIES (Optimized)
-- =============================================

-- Profiles
create policy "profiles_select_policy" on profiles
  for select using (
    id = (select auth.uid())
    or exists (select 1 from profiles p where p.id = (select auth.uid()) and p.role in ('manager', 'admin'))
  );
create policy "profiles_update_policy" on profiles
  for update using (id = (select auth.uid()));
create policy "profiles_insert_policy" on profiles
  for insert with check (id = (select auth.uid()));

-- Scripts
create policy "scripts_select_policy" on scripts
  for select using (
    is_active = true
    or exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin')
  );
create policy "scripts_insert_policy" on scripts
  for insert with check (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));
create policy "scripts_update_policy" on scripts
  for update using (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));
create policy "scripts_delete_policy" on scripts
  for delete using (exists (select 1 from profiles where id = (select auth.uid()) and role = 'admin'));

-- Calls
create policy "calls_select_policy" on calls
  for select using (
    rep_id = (select auth.uid())
    or exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin'))
  );
create policy "calls_insert_policy" on calls
  for insert with check (rep_id = (select auth.uid()));
create policy "calls_update_policy" on calls
  for update using (
    rep_id = (select auth.uid())
    or exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin'))
  );

-- Scores
create policy "scores_select_policy" on scores
  for select using (
    exists (select 1 from calls where calls.id = scores.call_id and calls.rep_id = (select auth.uid()))
    or exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin'))
  );

-- Practice sessions
create policy "practice_sessions_select_policy" on practice_sessions
  for select using (
    rep_id = (select auth.uid())
    or exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin'))
  );
create policy "practice_sessions_insert_policy" on practice_sessions
  for insert with check (rep_id = (select auth.uid()));
create policy "practice_sessions_update_policy" on practice_sessions
  for update using (rep_id = (select auth.uid()));

-- Call notes
create policy "call_notes_select_policy" on call_notes
  for select using (
    author_id = (select auth.uid())
    or exists (select 1 from calls where calls.id = call_notes.call_id and calls.rep_id = (select auth.uid()))
    or exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin'))
  );
create policy "call_notes_insert_policy" on call_notes
  for insert with check (author_id = (select auth.uid()));
create policy "call_notes_update_policy" on call_notes
  for update using (author_id = (select auth.uid()));

-- Sync logs
create policy "hubspot_sync_log_select_policy" on hubspot_sync_log
  for select using (exists (select 1 from profiles where id = (select auth.uid()) and role in ('manager', 'admin')));
create policy "Allow authenticated read aircall" on aircall_sync_log
  for select to authenticated using (true);
create policy "Allow service role write aircall" on aircall_sync_log
  for all to service_role using (true);
create policy "Allow authenticated read ringover sync" on ringover_sync_log
  for select to authenticated using (true);
create policy "Allow service role write ringover sync" on ringover_sync_log
  for all to service_role using (true);

-- Practice challenges
create policy "Anyone can read challenges" on practice_challenges
  for select to authenticated using (true);
create policy "Managers can create challenges" on practice_challenges
  for insert to authenticated with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin'))
  );
create policy "Managers can update challenges" on practice_challenges
  for update to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin'))
  );
create policy "Managers can delete challenges" on practice_challenges
  for delete to authenticated using (
    exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin'))
  );
create policy "Service role full access to challenges" on practice_challenges
  for all to service_role using (true);

-- Challenge participations
create policy "Anyone can read participations" on challenge_participations
  for select to authenticated using (true);
create policy "Users can create own participations" on challenge_participations
  for insert to authenticated with check (rep_id = auth.uid());
create policy "Users can update own participations" on challenge_participations
  for update to authenticated using (rep_id = auth.uid());
create policy "Service role full access to participations" on challenge_participations
  for all to service_role using (true);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles for each row execute procedure update_updated_at();
create trigger update_scripts_updated_at
  before update on scripts for each row execute procedure update_updated_at();
create trigger update_calls_updated_at
  before update on calls for each row execute procedure update_updated_at();
create trigger update_call_notes_updated_at
  before update on call_notes for each row execute procedure update_updated_at();

-- Practice challenges updated_at trigger
create or replace function update_practice_challenges_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger practice_challenges_updated_at
  before update on practice_challenges
  for each row execute function update_practice_challenges_updated_at();

-- Get rep stats function
create or replace function public.get_rep_stats(p_rep_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
begin
  with recent_calls as (
    select * from public.calls
    where rep_id = p_rep_id
      and status = 'complete'
      and call_date >= now() - interval '30 days'
  ),
  week_calls as (
    select * from recent_calls
    where call_date >= now() - interval '7 days'
  ),
  prev_week_calls as (
    select * from public.calls
    where rep_id = p_rep_id
      and status = 'complete'
      and call_date >= now() - interval '14 days'
      and call_date < now() - interval '7 days'
  ),
  phase_scores as (
    select s.phase, avg(s.score) as avg_score
    from public.scores s
    join recent_calls c on c.id = s.call_id
    group by s.phase
  ),
  practice_count as (
    select count(*) as cnt from public.practice_sessions
    where rep_id = p_rep_id
      and started_at >= now() - interval '7 days'
  )
  select json_build_object(
    'average_score', coalesce((select avg(overall_score) from recent_calls), 0),
    'calls_this_week', (select count(*) from week_calls),
    'calls_this_month', (select count(*) from recent_calls),
    'practice_sessions_this_week', (select cnt from practice_count),
    'score_trend', coalesce(
      (select avg(overall_score) from week_calls) -
      (select avg(overall_score) from prev_week_calls),
      0
    ),
    'scores_by_phase', coalesce(
      (select json_agg(json_build_object(
        'phase', phase,
        'score', round(avg_score::numeric, 1),
        'label', initcap(phase)
      )) from phase_scores),
      '[]'::json
    )
  ) into result;
  return result;
end;
$$;

-- Get manager stats function
create or replace function public.get_manager_stats()
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  result json;
begin
  with team_calls as (
    select c.*, p.full_name as rep_name
    from public.calls c
    join public.profiles p on p.id = c.rep_id
    where c.status = 'complete'
      and c.call_date >= now() - interval '30 days'
  ),
  week_calls as (
    select * from team_calls
    where call_date >= now() - interval '7 days'
  ),
  rep_scores as (
    select rep_id, rep_name, avg(overall_score) as avg_score, count(*) as call_count
    from team_calls
    group by rep_id, rep_name
  ),
  score_dist as (
    select
      case
        when overall_score >= 90 then '90-100'
        when overall_score >= 80 then '80-89'
        when overall_score >= 70 then '70-79'
        when overall_score >= 60 then '60-69'
        else 'Below 60'
      end as range,
      count(*) as count
    from team_calls
    group by 1
    order by 1 desc
  )
  select json_build_object(
    'team_average_score', coalesce((select avg(overall_score) from team_calls), 0),
    'total_calls_this_week', (select count(*) from week_calls),
    'reps_below_threshold', (select count(*) from rep_scores where avg_score < 70),
    'practice_completion_rate', coalesce(
      (select count(*)::float / nullif((select count(distinct rep_id) from team_calls), 0) * 100
       from public.practice_sessions
       where status = 'completed'
         and started_at >= now() - interval '7 days'),
      0
    ),
    'score_distribution', coalesce(
      (select json_agg(json_build_object('range', range, 'count', count)) from score_dist),
      '[]'::json
    ),
    'team_leaderboard', coalesce(
      (select json_agg(json_build_object(
        'rep_id', rep_id,
        'rep_name', rep_name,
        'average_score', round(avg_score::numeric, 1),
        'calls_count', call_count
      ) order by avg_score desc) from rep_scores),
      '[]'::json
    )
  ) into result;
  return result;
end;
$$;

-- =============================================
-- STORAGE BUCKET FOR CALL RECORDINGS
-- =============================================
insert into storage.buckets (id, name, public) values ('call-recordings', 'call-recordings', false);

-- Storage policies
create policy "Users can upload own recordings"
  on storage.objects for insert
  with check (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own recordings"
  on storage.objects for select
  using (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Managers can view all recordings"
  on storage.objects for select
  using (
    bucket_id = 'call-recordings'
    and exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Service role can manage all recordings (needed for API routes)
create policy "Service role can manage recordings"
  on storage.objects for all
  to service_role
  using (bucket_id = 'call-recordings');

-- =============================================
-- COMMENTS
-- =============================================
comment on function public.update_updated_at() is 'Trigger function to automatically update updated_at timestamp.';
comment on function public.handle_new_user() is 'Trigger function to create profile when new user signs up.';
comment on function public.get_rep_stats(uuid) is 'Returns aggregated stats for a sales rep.';
comment on function public.get_manager_stats() is 'Returns aggregated team stats for managers.';
comment on column calls.bookmarks is 'Array of bookmarks with start_time, end_time, note, tag, created_at, created_by';
comment on column calls.summary is 'AI-generated summary/TLDR of the call scoring';
comment on table aircall_sync_log is 'Tracks Aircall sync job history';
comment on column profiles.aircall_user_id is 'Aircall user ID for call attribution';
comment on column calls.aircall_call_id is 'Aircall call ID for deduplication';
