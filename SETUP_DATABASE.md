# RepCoach Database Setup

Run these SQL statements in Supabase SQL Editor **one section at a time**.

Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query

---

## Step 1: Create Extensions and Types

```sql
create extension if not exists "uuid-ossp";

create type user_role as enum ('rep', 'manager', 'admin');
create type call_source as enum ('hubspot', 'manual');
create type call_status as enum ('pending', 'transcribing', 'scoring', 'complete', 'error');
create type practice_status as enum ('active', 'completed', 'abandoned');
create type persona_type as enum ('skeptical_parent', 'price_sensitive', 'engaged_ready', 'spouse_blocker', 'math_hater');
```

Click **Run**. Then create a new query for Step 2.

---

## Step 2: Create Tables

```sql
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

create table call_notes (
  id uuid default uuid_generate_v4() primary key,
  call_id uuid references calls(id) on delete cascade not null,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  is_flagged boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

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
```

Click **Run**. Then create a new query for Step 3.

---

## Step 3: Create Indexes

```sql
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
```

Click **Run**. Then create a new query for Step 4.

---

## Step 4: Enable Row Level Security

```sql
alter table profiles enable row level security;
alter table scripts enable row level security;
alter table calls enable row level security;
alter table scores enable row level security;
alter table practice_sessions enable row level security;
alter table call_notes enable row level security;
alter table hubspot_sync_log enable row level security;
```

Click **Run**. Then create a new query for Step 5.

---

## Step 5: Create RLS Policies

```sql
-- Profiles policies
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Managers can view all profiles" on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));

-- Scripts policies
create policy "Anyone can view active scripts" on scripts for select using (is_active = true);
create policy "Admins can manage scripts" on scripts for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Calls policies
create policy "Reps can view own calls" on calls for select using (auth.uid() = rep_id);
create policy "Reps can insert own calls" on calls for insert with check (auth.uid() = rep_id);
create policy "Reps can update own calls" on calls for update using (auth.uid() = rep_id);
create policy "Managers can view all calls" on calls for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));
create policy "Managers can update all calls" on calls for update using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));

-- Scores policies
create policy "Users can view scores for their calls" on scores for select using (exists (select 1 from calls where calls.id = scores.call_id and calls.rep_id = auth.uid()));
create policy "Managers can view all scores" on scores for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));

-- Practice sessions policies
create policy "Reps can view own practice sessions" on practice_sessions for select using (auth.uid() = rep_id);
create policy "Reps can insert own practice sessions" on practice_sessions for insert with check (auth.uid() = rep_id);
create policy "Reps can update own practice sessions" on practice_sessions for update using (auth.uid() = rep_id);
create policy "Managers can view all practice sessions" on practice_sessions for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));

-- Call notes policies
create policy "Users can view notes on their calls" on call_notes for select using (exists (select 1 from calls where calls.id = call_notes.call_id and calls.rep_id = auth.uid()) or author_id = auth.uid());
create policy "Managers can view all notes" on call_notes for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));
create policy "Users can create notes" on call_notes for insert with check (auth.uid() = author_id);
create policy "Users can update own notes" on call_notes for update using (auth.uid() = author_id);

-- Sync log policies
create policy "Managers can view sync logs" on hubspot_sync_log for select using (exists (select 1 from profiles where id = auth.uid() and role in ('manager', 'admin')));
```

Click **Run**. Then create a new query for Step 6.

---

## Step 6: Create Functions and Triggers

```sql
-- Function to handle new user profile creation
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
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
create trigger update_profiles_updated_at before update on profiles for each row execute procedure update_updated_at();
create trigger update_scripts_updated_at before update on scripts for each row execute procedure update_updated_at();
create trigger update_calls_updated_at before update on calls for each row execute procedure update_updated_at();
create trigger update_call_notes_updated_at before update on call_notes for each row execute procedure update_updated_at();
```

Click **Run**. Then create a new query for Step 7.

---

## Step 7: Create Stats Functions

```sql
create or replace function get_rep_stats(p_rep_id uuid)
returns json as $$
declare
  result json;
begin
  with recent_calls as (
    select * from calls where rep_id = p_rep_id and status = 'complete' and call_date >= now() - interval '30 days'
  ),
  week_calls as (
    select * from recent_calls where call_date >= now() - interval '7 days'
  ),
  phase_scores as (
    select s.phase, avg(s.score) as avg_score from scores s join recent_calls c on c.id = s.call_id group by s.phase
  )
  select json_build_object(
    'average_score', coalesce((select avg(overall_score) from recent_calls), 0),
    'calls_this_week', (select count(*) from week_calls),
    'calls_this_month', (select count(*) from recent_calls),
    'scores_by_phase', coalesce((select json_agg(json_build_object('phase', phase, 'score', round(avg_score::numeric, 1))) from phase_scores), '[]'::json)
  ) into result;
  return result;
end;
$$ language plpgsql security definer;

create or replace function get_manager_stats()
returns json as $$
declare
  result json;
begin
  with team_calls as (
    select c.*, p.full_name as rep_name from calls c join profiles p on p.id = c.rep_id where c.status = 'complete' and c.call_date >= now() - interval '30 days'
  ),
  rep_scores as (
    select rep_id, rep_name, avg(overall_score) as avg_score, count(*) as call_count from team_calls group by rep_id, rep_name
  )
  select json_build_object(
    'team_average_score', coalesce((select avg(overall_score) from team_calls), 0),
    'total_calls_this_week', (select count(*) from team_calls where call_date >= now() - interval '7 days'),
    'reps_below_threshold', (select count(*) from rep_scores where avg_score < 70),
    'team_leaderboard', coalesce((select json_agg(json_build_object('rep_id', rep_id, 'rep_name', rep_name, 'average_score', round(avg_score::numeric, 1), 'calls_count', call_count) order by avg_score desc) from rep_scores), '[]'::json)
  ) into result;
  return result;
end;
$$ language plpgsql security definer;
```

Click **Run**. Then create a new query for Step 8.

---

## Step 8: Add Pre-Algebra Script

```sql
insert into scripts (name, course, version, is_active, content) values (
  'Pre-Algebra Sales Script', 'Pre-Algebra', 1, true,
  '{"closer_framework":{"connect":{"description":"Build rapport","key_points":["Warm greeting","Ask about child by name"],"example_phrases":["Hi, thanks for taking the time to chat today!"],"scoring_criteria":["Used names","Warm tone"]},"listen":{"description":"Understand concerns","key_points":["Ask probing questions","Understand emotional impact"],"example_phrases":["What is your child struggling with?"],"scoring_criteria":["Asked follow-ups","Identified pain points"]},"outline":{"description":"Present solution","key_points":["Explain program","Highlight personalization"],"example_phrases":["Our program starts with a diagnostic."],"scoring_criteria":["Tailored presentation","Clear explanation"]},"solve":{"description":"Address concerns","key_points":["Connect features to pain points","Share success stories"],"example_phrases":["Our adaptive system gives extra practice where needed."],"scoring_criteria":["Addressed concerns","Used examples"]},"evaluate":{"description":"Handle objections","key_points":["Ask for questions","Address concerns"],"example_phrases":["How does this sound?"],"scoring_criteria":["Invited objections","Maintained positive tone"]},"resolve":{"description":"Close the sale","key_points":["Clear ask","Create urgency"],"example_phrases":["Ready to get started?"],"scoring_criteria":["Clear call to action","Smooth close"]}},"key_phrases":["personalized learning","diagnostic assessment","live tutoring"],"objection_responses":[{"objection":"Too expensive","response":"What would it cost if they need summer school?","category":"price"},{"objection":"Need to talk to spouse","response":"When can we schedule a call with both of you?","category":"decision_maker"}]}'::jsonb
);
```

Click **Run**. Then create a new query for Step 9.

---

## Step 9: Add Algebra 1 Script

```sql
insert into scripts (name, course, version, is_active, content) values (
  'Algebra 1 Sales Script', 'Algebra 1', 1, true,
  '{"closer_framework":{"connect":{"description":"Build rapport","key_points":["Acknowledge Algebra 1 importance","Ask about current situation"],"example_phrases":["Algebra 1 sets the stage for all future math."],"scoring_criteria":["Used names","Showed understanding"]},"listen":{"description":"Understand challenges","key_points":["Identify specific struggles","Learn about goals"],"example_phrases":["What topics are giving trouble?"],"scoring_criteria":["Identified struggles","Asked about goals"]},"outline":{"description":"Present program","key_points":["Explain diagnostic","Highlight step-by-step instruction"],"example_phrases":["We break down concepts into manageable steps."],"scoring_criteria":["Explained structure","Connected to algebra"]},"solve":{"description":"Connect solution","key_points":["Address specific struggles","Share success stories"],"example_phrases":["Our walkthroughs make equations click."],"scoring_criteria":["Addressed concerns","Created vision"]},"evaluate":{"description":"Check for concerns","key_points":["Ask what they think","Address concerns"],"example_phrases":["Any concerns I can address?"],"scoring_criteria":["Asked for feedback","Showed empathy"]},"resolve":{"description":"Close","key_points":["Ask for commitment","Set expectations"],"example_phrases":["Shall we get enrolled today?"],"scoring_criteria":["Clear call to action","Positive closing"]}},"key_phrases":["foundational skills","step-by-step","bridge the gaps"],"objection_responses":[{"objection":"School offers free tutoring","response":"Our program adapts to exactly what they need and is available 24/7.","category":"alternative"},{"objection":"Already so busy","response":"Students can do 15-20 minutes a day, whenever works.","category":"time"}]}'::jsonb
);
```

Click **Run**. Then create a new query for Step 10.

---

## Step 10: Add Geometry Script

```sql
insert into scripts (name, course, version, is_active, content) values (
  'Geometry Sales Script', 'Geometry', 1, true,
  '{"closer_framework":{"connect":{"description":"Build rapport","key_points":["Acknowledge geometry is different","Show expertise"],"example_phrases":["Geometry is more visual and proof-based."],"scoring_criteria":["Acknowledged uniqueness","Showed expertise"]},"listen":{"description":"Understand challenges","key_points":["Identify struggling areas","Understand visualization difficulties"],"example_phrases":["What part of geometry is most frustrating?"],"scoring_criteria":["Identified challenges","Asked about spatial skills"]},"outline":{"description":"Present features","key_points":["Explain visual tools","Mention proof practice"],"example_phrases":["Our program uses interactive visuals."],"scoring_criteria":["Highlighted visual tools","Addressed proofs"]},"solve":{"description":"Address struggles","key_points":["Connect features to pain points","Share success stories"],"example_phrases":["Our proof builder helps them see the logic."],"scoring_criteria":["Addressed concerns","Showed path"]},"evaluate":{"description":"Handle objections","key_points":["Verify approach resonates","Check readiness"],"example_phrases":["How does this approach sound?"],"scoring_criteria":["Asked for feedback","Confirmed value"]},"resolve":{"description":"Close","key_points":["Make clear ask","Set expectations"],"example_phrases":["Ready to help master geometry?"],"scoring_criteria":["Clear call to action","Confident close"]}},"key_phrases":["visual learning","proof mastery","spatial reasoning"],"objection_responses":[{"objection":"Just one semester","response":"The skills - logical reasoning, proof writing - are essential for higher math.","category":"urgency"},{"objection":"Use YouTube","response":"Geometry requires active practice. Our platform provides hands-on practice with feedback.","category":"alternative"}]}'::jsonb
);
```

Click **Run**. Then create a new query for Step 11.

---

## Step 11: Add Algebra 2 Script

```sql
insert into scripts (name, course, version, is_active, content) values (
  'Algebra 2 Sales Script', 'Algebra 2', 1, true,
  '{"closer_framework":{"connect":{"description":"Connect","key_points":["Acknowledge difficulty","Show college prep understanding"],"example_phrases":["Algebra 2 is the gateway to pre-calc and calculus."],"scoring_criteria":["Acknowledged difficulty","Showed importance"]},"listen":{"description":"Understand challenges","key_points":["Identify topic struggles","Learn about college goals"],"example_phrases":["What topics are causing the most trouble?"],"scoring_criteria":["Identified struggles","Asked about goals"]},"outline":{"description":"Present features","key_points":["Explain advanced coverage","Mention SAT/ACT alignment"],"example_phrases":["The program aligns with SAT and ACT math."],"scoring_criteria":["Explained coverage","Connected to test prep"]},"solve":{"description":"Connect to needs","key_points":["Address specific struggles","Share success stories"],"example_phrases":["I worked with a student who improved SAT math by 150 points."],"scoring_criteria":["Addressed struggles","Connected to goals"]},"evaluate":{"description":"Check readiness","key_points":["Verify approach","Handle objections"],"example_phrases":["How does this sound for your situation?"],"scoring_criteria":["Asked for reaction","Addressed concerns"]},"resolve":{"description":"Close","key_points":["Clear ask","Emphasize timing"],"example_phrases":["Should we get started before they fall further behind?"],"scoring_criteria":["Clear call to action","Created urgency"]}},"key_phrases":["college readiness","SAT/ACT prep","fill the gaps"],"objection_responses":[{"objection":"Limited time","response":"Students can work at their own pace. Even 20 minutes a day helps.","category":"time"},{"objection":"SAT more important","response":"Mastering Algebra 2 IS SAT prep. Our program covers both.","category":"priority"}]}'::jsonb
);
```

Click **Run**.

---

## Step 12: Create Storage Bucket

**Do this in the Supabase UI, not SQL:**

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `call-recordings`
4. **Uncheck** "Public bucket"
5. Click **Create bucket**

Then run this SQL:

```sql
create policy "Users can upload own recordings" on storage.objects for insert with check (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Users can view own recordings" on storage.objects for select using (bucket_id = 'call-recordings' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Managers can view all recordings" on storage.objects for select using (bucket_id = 'call-recordings' and exists (select 1 from public.profiles where id = auth.uid() and role in ('manager', 'admin')));
```

---

## Done!

All database setup is complete. You can now:
1. Update your `.env.local` with API keys
2. Run `npm run dev`
3. Visit http://localhost:3000
