-- RepCoach Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Enum types
create type user_role as enum ('rep', 'manager', 'admin');
create type call_source as enum ('hubspot', 'manual');
create type call_status as enum ('pending', 'transcribing', 'scoring', 'complete', 'error');
create type practice_status as enum ('active', 'completed', 'abandoned');
create type persona_type as enum ('skeptical_parent', 'price_sensitive', 'engaged_ready', 'spouse_blocker', 'math_hater');

-- Profiles table (extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role user_role default 'rep' not null,
  hubspot_owner_id text,
  avatar_url text,
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
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Scores table
create table scores (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references calls(id) on delete cascade not null,
  phase text not null check (phase in ('connect', 'listen', 'outline', 'solve', 'evaluate', 'resolve')),
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

-- Indexes
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

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table scripts enable row level security;
alter table calls enable row level security;
alter table scores enable row level security;
alter table practice_sessions enable row level security;
alter table call_notes enable row level security;
alter table hubspot_sync_log enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Managers can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Scripts policies (everyone can read active scripts)
create policy "Anyone can view active scripts"
  on scripts for select
  using (is_active = true);

create policy "Admins can manage scripts"
  on scripts for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Calls policies
create policy "Reps can view own calls"
  on calls for select
  using (auth.uid() = rep_id);

create policy "Reps can insert own calls"
  on calls for insert
  with check (auth.uid() = rep_id);

create policy "Reps can update own calls"
  on calls for update
  using (auth.uid() = rep_id);

create policy "Managers can view all calls"
  on calls for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

create policy "Managers can update all calls"
  on calls for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Scores policies
create policy "Users can view scores for their calls"
  on scores for select
  using (
    exists (
      select 1 from calls
      where calls.id = scores.call_id and calls.rep_id = auth.uid()
    )
  );

create policy "Managers can view all scores"
  on scores for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Practice sessions policies
create policy "Reps can view own practice sessions"
  on practice_sessions for select
  using (auth.uid() = rep_id);

create policy "Reps can insert own practice sessions"
  on practice_sessions for insert
  with check (auth.uid() = rep_id);

create policy "Reps can update own practice sessions"
  on practice_sessions for update
  using (auth.uid() = rep_id);

create policy "Managers can view all practice sessions"
  on practice_sessions for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Call notes policies
create policy "Users can view notes on their calls"
  on call_notes for select
  using (
    exists (
      select 1 from calls
      where calls.id = call_notes.call_id and calls.rep_id = auth.uid()
    )
    or author_id = auth.uid()
  );

create policy "Managers can view all notes"
  on call_notes for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

create policy "Users can create notes"
  on call_notes for insert
  with check (auth.uid() = author_id);

create policy "Users can update own notes"
  on call_notes for update
  using (auth.uid() = author_id);

-- Sync log policies (managers/admins only)
create policy "Managers can view sync logs"
  on hubspot_sync_log for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('manager', 'admin')
    )
  );

-- Functions

-- Function to handle new user profile creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Function to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure update_updated_at();

create trigger update_scripts_updated_at
  before update on scripts
  for each row execute procedure update_updated_at();

create trigger update_calls_updated_at
  before update on calls
  for each row execute procedure update_updated_at();

create trigger update_call_notes_updated_at
  before update on call_notes
  for each row execute procedure update_updated_at();

-- Function to get rep stats
create or replace function get_rep_stats(p_rep_id uuid)
returns json as $$
declare
  result json;
begin
  with recent_calls as (
    select * from calls
    where rep_id = p_rep_id
      and status = 'complete'
      and call_date >= now() - interval '30 days'
  ),
  week_calls as (
    select * from recent_calls
    where call_date >= now() - interval '7 days'
  ),
  prev_week_calls as (
    select * from calls
    where rep_id = p_rep_id
      and status = 'complete'
      and call_date >= now() - interval '14 days'
      and call_date < now() - interval '7 days'
  ),
  phase_scores as (
    select
      s.phase,
      avg(s.score) as avg_score
    from scores s
    join recent_calls c on c.id = s.call_id
    group by s.phase
  ),
  practice_count as (
    select count(*) as cnt from practice_sessions
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
$$ language plpgsql security definer;

-- Function to get manager stats
create or replace function get_manager_stats()
returns json as $$
declare
  result json;
begin
  with team_calls as (
    select c.*, p.full_name as rep_name
    from calls c
    join profiles p on p.id = c.rep_id
    where c.status = 'complete'
      and c.call_date >= now() - interval '30 days'
  ),
  week_calls as (
    select * from team_calls
    where call_date >= now() - interval '7 days'
  ),
  rep_scores as (
    select
      rep_id,
      rep_name,
      avg(overall_score) as avg_score,
      count(*) as call_count
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
       from practice_sessions
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
$$ language plpgsql security definer;

-- Storage bucket for call recordings
-- Run this separately in Supabase Dashboard > Storage
-- insert into storage.buckets (id, name, public) values ('call-recordings', 'call-recordings', false);

-- Storage policies (run in SQL editor after creating bucket)
-- create policy "Users can upload own recordings"
--   on storage.objects for insert
--   with check (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can view own recordings"
--   on storage.objects for select
--   using (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Managers can view all recordings"
--   on storage.objects for select
--   using (
--     bucket_id = 'call-recordings'
--     and exists (
--       select 1 from profiles
--       where id = auth.uid() and role in ('manager', 'admin')
--     )
--   );
