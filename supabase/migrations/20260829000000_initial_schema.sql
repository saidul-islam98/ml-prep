-- Initial schema: Cohere Preparation Tracker (todo.md Task 3b)
-- Security model (WEBAPP_SPEC.md 10, 13):
--   * UUID PKs, created_at/updated_at everywhere.
--   * Every child carries user_id; composite owner FKs prevent cross-user
--     child references; parent tables have UNIQUE (id, user_id).
--   * Operation-specific RLS policies, no blanket CRUD.
--   * Least-privilege grants: task_events are SELECT-only; tasks are
--     SELECT-only (mutations go through audited RPCs added in Task 4).
--   * Deleting an Auth user cascades all owned application rows.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (10.1)
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'America/Toronto'
    constraint profiles_timezone_fixed check (timezone = 'America/Toronto'),
  reminder_local_time time not null default '17:00'
    constraint profiles_reminder_time_fixed check (reminder_local_time = '17:00'),
  reminder_installed_at timestamptz,
  reminder_verified_at timestamptz,
  post_training_enabled boolean not null default false,
  template_version integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- plan_weeks (10.2)
-- ---------------------------------------------------------------------------

create table public.plan_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_number integer not null
    constraint plan_weeks_number_range check (week_number between 1 and 14),
  title text not null,
  start_date date not null,
  end_date date not null,
  phase text not null,
  exit_check text not null,
  constraint plan_weeks_date_order check (end_date >= start_date),
  constraint plan_weeks_user_week_unique unique (user_id, week_number),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- projects (10.5)
-- ---------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_key text not null,
  name text not null,
  target_roles text[] not null default '{}',
  budget_minutes integer not null
    constraint projects_budget_positive check (budget_minutes > 0),
  state text not null default 'locked'
    constraint projects_state_valid check (state in ('locked', 'active', 'completed', 'at_risk')),
  repository_url text,
  design_url text,
  report_url text,
  demo_url text,
  blocker_note text,
  constraint projects_user_key_unique unique (user_id, project_key),
  constraint projects_id_user_unique unique (id, user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- practice_sessions (10.6) - before tasks because tasks may link to sessions
-- ---------------------------------------------------------------------------

create table public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_type text not null
    constraint practice_sessions_type_valid check (session_type in ('coding', 'mock')),
  date date not null,
  state text not null default 'planned'
    constraint practice_sessions_state_valid check (state in ('planned', 'in_progress', 'completed', 'abandoned', 'skipped')),
  completed_at timestamptz,
  topic text not null,
  allotted_minutes integer not null
    constraint practice_sessions_allotted_positive check (allotted_minutes > 0),
  elapsed_minutes integer
    constraint practice_sessions_elapsed_positive check (elapsed_minutes is null or elapsed_minutes > 0),
  result text,
  mistake_category text
    constraint practice_sessions_mistake_valid check (
      mistake_category is null or
      mistake_category in ('knowledge', 'reasoning', 'coding', 'communication', 'time_management')
    ),
  correction_due_date date,
  corrected_at date,
  notes text,
  evidence_url text
    constraint practice_sessions_evidence_https check (evidence_url is null or evidence_url like 'https://%'),
  constraint practice_sessions_completed_has_timestamp
    check (state = 'completed' or completed_at is null),
  constraint practice_sessions_id_user_unique unique (id, user_id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tasks (10.3)
-- ---------------------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  source_week_number integer
    constraint tasks_source_week_range check (source_week_number is null or source_week_number between 1 and 14),
  template_task_key text,
  title text not null,
  description text,
  acceptance_note text,
  category text not null
    constraint tasks_category_valid check (category in ('deep_work', 'practice', 'application', 'review')),
  role_tags text[] not null default '{}',
  project_id uuid,
  original_scheduled_date date not null,
  scheduled_date date not null,
  estimated_minutes integer not null
    constraint tasks_estimate_positive check (estimated_minutes > 0),
  actual_minutes integer
    constraint tasks_actual_positive check (actual_minutes is null or actual_minutes > 0),
  revision integer not null default 0
    constraint tasks_revision_nonnegative check (revision >= 0),
  state text not null default 'not_started'
    constraint tasks_state_valid check (state in ('not_started', 'in_progress', 'completed', 'skipped', 'archived')),
  completed_at timestamptz,
  skip_reason text,
  evidence_url text
    constraint tasks_evidence_https check (evidence_url is null or evidence_url like 'https://%'),
  evidence_note text,
  source_practice_session_id uuid,
  constraint tasks_user_template_key_unique unique (user_id, template_task_key),
  constraint tasks_id_user_unique unique (id, user_id),
  constraint tasks_project_owner_fk foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete restrict,
  constraint tasks_practice_session_owner_fk foreign key (source_practice_session_id, user_id)
    references public.practice_sessions (id, user_id) on delete restrict,
  -- State-dependent field integrity (8.3):
  constraint tasks_completed_fields check (
    state <> 'completed' or (completed_at is not null and actual_minutes is not null)
  ),
  constraint tasks_completed_at_only_when_completed check (
    state = 'completed' or completed_at is null
  ),
  constraint tasks_actual_only_when_completed check (
    state = 'completed' or actual_minutes is null
  ),
  constraint tasks_skip_reason_only_when_skipped check (
    state = 'skipped' or skip_reason is null
  ),
  constraint tasks_skip_requires_reason check (
    state <> 'skipped' or skip_reason is not null
  ),
  -- Template tasks cannot be archived (8.3): archive is for custom tasks.
  constraint tasks_archive_custom_only check (
    state <> 'archived' or template_task_key is null
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_scheduled_date_idx on public.tasks (user_id, scheduled_date);
create index tasks_user_state_idx on public.tasks (user_id, state);

-- ---------------------------------------------------------------------------
-- task_events (10.4) - immutable event history
-- ---------------------------------------------------------------------------

create table public.task_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid not null,
  event_type text not null
    constraint task_events_type_valid check (
      event_type in ('created', 'started', 'completed', 'reopened', 'rescheduled', 'skipped', 'edited', 'archived')
    ),
  occurred_at timestamptz not null default now(),
  from_scheduled_date date,
  to_scheduled_date date,
  metadata jsonb not null default '{}'::jsonb,
  constraint task_events_task_owner_fk foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_events_task_idx on public.task_events (user_id, task_id, occurred_at);

-- ---------------------------------------------------------------------------
-- project_milestones (10.5)
-- ---------------------------------------------------------------------------

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null,
  title text not null,
  acceptance_criteria text not null,
  target_date date,
  completed_at timestamptz,
  evidence_url text
    constraint milestones_evidence_https check (evidence_url is null or evidence_url like 'https://%'),
  sort_order integer not null default 0,
  is_completion_gate boolean not null default false,
  constraint milestones_project_owner_fk foreign key (project_id, user_id)
    references public.projects (id, user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index milestones_project_idx on public.project_milestones (user_id, project_id, sort_order);

-- ---------------------------------------------------------------------------
-- mock_scores (10.7)
-- ---------------------------------------------------------------------------

create table public.mock_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  practice_session_id uuid not null,
  dimension_key text not null
    constraint mock_scores_dimension_valid check (
      dimension_key in (
        'problem_framing', 'technical_depth', 'evidence', 'tradeoffs',
        'engineering_quality', 'product_judgment', 'communication', 'integrity'
      )
    ),
  score integer not null constraint mock_scores_score_range check (score between 1 and 5),
  constraint mock_scores_session_owner_fk foreign key (practice_session_id, user_id)
    references public.practice_sessions (id, user_id) on delete cascade,
  constraint mock_scores_session_dimension_unique unique (practice_session_id, dimension_key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- readiness_gates (10.8)
-- ---------------------------------------------------------------------------

create table public.readiness_gates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null
    constraint readiness_gates_role_valid check (role_key in ('data_eval', 'agent_env', 'post_training')),
  gate_key text not null,
  title text not null,
  state text not null default 'not_assessed'
    constraint readiness_gates_state_valid check (state in ('not_assessed', 'in_progress', 'ready', 'at_risk')),
  evidence_note text,
  evidence_url text
    constraint readiness_gates_evidence_https check (evidence_url is null or evidence_url like 'https://%'),
  assessed_at timestamptz,
  constraint readiness_gates_role_gate_unique unique (user_id, role_key, gate_key),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- daily_checkins (10.9)
-- ---------------------------------------------------------------------------

create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  learning text,
  highest_risk_gap text,
  constraint daily_checkins_user_date_unique unique (user_id, local_date),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'plan_weeks', 'projects', 'practice_sessions', 'tasks',
    'task_events', 'project_milestones', 'mock_scores', 'readiness_gates', 'daily_checkins'
  ]
  loop
    execute format(
      'create trigger set_updated_at_%s before update on public.%I
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security: operation-specific policies
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.plan_weeks enable row level security;
alter table public.projects enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.tasks enable row level security;
alter table public.task_events enable row level security;
alter table public.project_milestones enable row level security;
alter table public.mock_scores enable row level security;
alter table public.readiness_gates enable row level security;
alter table public.daily_checkins enable row level security;

-- profiles: select/update own row; inserts happen only in seed_plan_v1.
create policy profiles_select_own on public.profiles
  for select to authenticated using (user_id = auth.uid());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- plan_weeks: read-only (template content; seeded by RPC).
create policy plan_weeks_select_own on public.plan_weeks
  for select to authenticated using (user_id = auth.uid());

-- projects: read + update own.
create policy projects_select_own on public.projects
  for select to authenticated using (user_id = auth.uid());
create policy projects_update_own on public.projects
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- project_milestones: read + update own (completion/evidence).
create policy milestones_select_own on public.project_milestones
  for select to authenticated using (user_id = auth.uid());
create policy milestones_update_own on public.project_milestones
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- tasks: read-only for clients. Every mutation flows through audited RPCs.
create policy tasks_select_own on public.tasks
  for select to authenticated using (user_id = auth.uid());

-- task_events: read-only. No client insert/update/delete, ever (10.4).
create policy task_events_select_own on public.task_events
  for select to authenticated using (user_id = auth.uid());

-- practice_sessions: full ownership (user-created records, not audit trail).
create policy practice_sessions_select_own on public.practice_sessions
  for select to authenticated using (user_id = auth.uid());
create policy practice_sessions_insert_own on public.practice_sessions
  for insert to authenticated with check (user_id = auth.uid());
create policy practice_sessions_update_own on public.practice_sessions
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy practice_sessions_delete_own on public.practice_sessions
  for delete to authenticated using (user_id = auth.uid());

-- mock_scores: full ownership within own sessions (owner FK also enforced).
create policy mock_scores_select_own on public.mock_scores
  for select to authenticated using (user_id = auth.uid());
create policy mock_scores_insert_own on public.mock_scores
  for insert to authenticated with check (user_id = auth.uid());
create policy mock_scores_update_own on public.mock_scores
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy mock_scores_delete_own on public.mock_scores
  for delete to authenticated using (user_id = auth.uid());

-- readiness_gates: read + update own (explicit evidence-based assessment).
create policy readiness_gates_select_own on public.readiness_gates
  for select to authenticated using (user_id = auth.uid());
create policy readiness_gates_update_own on public.readiness_gates
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- daily_checkins: full ownership.
create policy daily_checkins_select_own on public.daily_checkins
  for select to authenticated using (user_id = auth.uid());
create policy daily_checkins_insert_own on public.daily_checkins
  for insert to authenticated with check (user_id = auth.uid());
create policy daily_checkins_update_own on public.daily_checkins
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy daily_checkins_delete_own on public.daily_checkins
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Least-privilege grants. Start from nothing, then grant exactly what the UI
-- needs. anon receives nothing anywhere.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

-- Read access:
grant select on public.profiles, public.plan_weeks, public.projects,
  public.project_milestones, public.tasks, public.task_events,
  public.practice_sessions, public.mock_scores, public.readiness_gates,
  public.daily_checkins
  to authenticated;

-- Update access (own rows only, enforced by RLS):
grant update on public.projects, public.project_milestones,
  public.readiness_gates, public.practice_sessions, public.mock_scores,
  public.daily_checkins
  to authenticated;

-- profiles: fixed timezone/reminder in MVP; users may only set reminder status.
grant update (reminder_installed_at, reminder_verified_at) on public.profiles to authenticated;

-- Mutating access for user-owned records:
grant insert, delete on public.practice_sessions, public.mock_scores,
  public.daily_checkins
  to authenticated;

-- tasks and task_events: NO insert/update/delete grants. Task mutations and
-- event writes occur only inside server RPCs (Task 4).
