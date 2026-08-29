-- Profile bootstrap, atomic plan seeding, and the optional-track unlock
-- (todo.md Task 4b; WEBAPP_SPEC.md sections 10.10 and 11).
--
-- seed_plan_v1():
--   * creates the absent profile, locks it, repairs an incomplete seed
--     idempotently, and writes template_version = 1 only after every row
--     succeeds. No client-supplied payload is trusted: all content comes
--     from private.template_artifacts (build-generated, version-controlled).
--   * deterministic UUIDs from the artifact make re-inserts conflict-free.
--   * 'created' events are appended only for tasks actually inserted now, so
--     repair never duplicates history.
--
-- unlock_post_training(p_opt_in):
--   * one-way: validates Project 1 and Project 2 completion-gate evidence,
--     requires explicit opt-in, verifies the full 1,200-minute mapped swap is
--     still open, deactivates it with audit events, activates Project 3, and
--     flips the profile flag - atomically. The active plan never exceeds
--     196 hours because the swap is exact.

-- ---------------------------------------------------------------------------
-- seed_plan_v1
-- ---------------------------------------------------------------------------

create or replace function public.seed_plan_v1()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_artifact private.template_artifacts%rowtype;
  v_version integer;
  v_weeks int := 0;
  v_tasks int := 0;
  v_new_tasks int := 0;
  v_projects int := 0;
  v_milestones int := 0;
  v_gates int := 0;
  v_row record;
  v_inserted uuid;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select * into v_artifact from private.template_artifacts where version = 1;
  if not found then
    raise exception 'template_artifact_missing: template v1 artifact is not loaded'
      using errcode = '22000';
  end if;

  -- Create the absent profile, then lock it so simultaneous first logins on
  -- two devices serialize: the second call sees the completed seed and no-ops.
  insert into public.profiles (user_id) values (v_user) on conflict (user_id) do nothing;
  select template_version into v_version
  from public.profiles
  where user_id = v_user
  for update;

  if v_version = 1 then
    return jsonb_build_object('status', 'already_seeded');
  end if;

  -- Weeks.
  for v_row in
    select * from jsonb_to_recordset(v_artifact.payload -> 'weeks')
      as w(id uuid, week int, title text, "start" date, "end" date, phase text, "exitCheck" text)
  loop
    insert into public.plan_weeks (id, user_id, week_number, title, start_date, end_date, phase, exit_check)
    values (v_row.id, v_user, v_row.week, v_row.title, v_row."start", v_row."end", v_row.phase, v_row."exitCheck")
    on conflict (id) do nothing;
    v_weeks := v_weeks + 1;
  end loop;

  -- Projects.
  for v_row in
    select * from jsonb_to_recordset(v_artifact.payload -> 'projects')
      as p(id uuid, key text, name text, target_roles text[], budget_minutes int, state text, purpose text)
  loop
    insert into public.projects (id, user_id, project_key, name, target_roles, budget_minutes, state)
    values (v_row.id, v_user, v_row.key, v_row.name, v_row.target_roles, v_row.budget_minutes, v_row.state)
    on conflict (id) do nothing;
    v_projects := v_projects + 1;
  end loop;

  -- Milestones.
  for v_row in
    select p.id as project_id, m.*
    from jsonb_to_recordset(v_artifact.payload -> 'projects') as p(id uuid, key text, milestones jsonb),
         jsonb_to_recordset(p.milestones)
           as m(id uuid, key text, title text, acceptance text, target_date date,
                is_completion_gate boolean, sort_order int)
  loop
    insert into public.project_milestones
      (id, user_id, project_id, title, acceptance_criteria, target_date, sort_order, is_completion_gate)
    values
      (v_row.id, v_user, v_row.project_id, v_row.title, v_row.acceptance,
       v_row.target_date, v_row.sort_order, v_row.is_completion_gate)
    on conflict (id) do nothing;
    v_milestones := v_milestones + 1;
  end loop;

  -- Tasks. Optional Post-Training tasks are preseeded with the post_training
  -- role tag; clients exclude them until the profile flag is enabled.
  for v_row in
    select * from jsonb_to_recordset(v_artifact.payload -> 'tasks')
      as t(id uuid, key text, week int, date date, category text, minutes int,
           title text, roles text[], project text, fixed_deadline boolean,
           optional_track boolean)
  loop
    insert into public.tasks
      (id, user_id, source_week_number, template_task_key, title, category,
       role_tags, project_id, original_scheduled_date, scheduled_date,
       estimated_minutes, revision, state)
    values
      (v_row.id, v_user, v_row.week, v_row.key, v_row.title, v_row.category,
       v_row.roles,
       (select p.id from jsonb_to_recordset(v_artifact.payload -> 'projects')
          as p(id uuid, key text) where p.key = v_row.project),
       v_row.date, v_row.date, v_row.minutes, 0, 'not_started')
    on conflict (id) do nothing
    returning id into v_inserted;

    v_tasks := v_tasks + 1;
    if v_inserted is not null then
      insert into public.task_events (user_id, task_id, event_type, metadata)
      values (
        v_user, v_inserted, 'created',
        jsonb_build_object(
          'template_task_key', v_row.key,
          'template_version', 1,
          'category', v_row.category,
          'estimated_minutes', v_row.minutes,
          'scheduled_date', v_row.date,
          'optional_track', v_row.optional_track
        )
      );
      v_new_tasks := v_new_tasks + 1;
    end if;
  end loop;

  -- Readiness gates.
  for v_row in
    select * from jsonb_to_recordset(v_artifact.payload -> 'gates')
      as g(id uuid, role text, key text, title text)
  loop
    insert into public.readiness_gates (id, user_id, role_key, gate_key, title)
    values (v_row.id, v_user, v_row.role, v_row.key, v_row.title)
    on conflict (id) do nothing;
    v_gates := v_gates + 1;
  end loop;

  -- Template version is written last: it marks the seed complete only after
  -- every required row has succeeded (single transaction, but the ordering
  -- documents the intent and keeps partial states detectable).
  update public.profiles set template_version = 1 where user_id = v_user;

  return jsonb_build_object(
    'status', 'ok',
    'counts', jsonb_build_object(
      'weeks', v_weeks,
      'tasks', v_tasks,
      'new_tasks', v_new_tasks,
      'projects', v_projects,
      'milestones', v_milestones,
      'gates', v_gates
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- unlock_post_training
-- ---------------------------------------------------------------------------

create or replace function public.unlock_post_training(p_opt_in boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_enabled boolean;
  v_artifact private.template_artifacts%rowtype;
  v_open_swap int;
  v_deactivated uuid[] := '{}'::uuid[];
  v_keys text[] := '{}'::text[];
  v_key text;
  v_minutes_deactivated int := 0;
  v_row record;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select post_training_enabled into v_enabled
  from public.profiles
  where user_id = v_user
  for update;
  if not found then
    raise exception 'profile_missing: seed the plan first' using errcode = '22000';
  end if;
  if v_enabled then
    raise exception 'already_enabled: the Post-Training track is irreversible'
      using errcode = '22000';
  end if;

  if p_opt_in is not true then
    raise exception 'opt_in_required: explicit opt-in is mandatory' using errcode = '22000';
  end if;

  select * into v_artifact from private.template_artifacts where version = 1;
  if not found then
    raise exception 'template_artifact_missing' using errcode = '22000';
  end if;

  -- Server-validated gates: every completion-gate milestone of the two
  -- required projects must be completed with qualifying evidence.
  if exists (
    select 1
    from public.project_milestones m
    join public.projects p on (m.project_id, m.user_id) = (p.id, p.user_id)
    where m.user_id = v_user
      and p.project_key in ('evalops', 'rollout_lab')
      and m.is_completion_gate
      and (m.completed_at is null or m.evidence_url is null)
  ) then
    raise exception 'gates_not_met: Project 1 and Project 2 completion gates need evidence'
      using errcode = '22000';
  end if;

  -- Exact swap: all mapped deactivation tasks must still be open so the
  -- full mapped allocation is freed and the active plan never exceeds 196 h.
  v_open_swap := 0;
  foreach v_key in array array(
    select jsonb_array_elements_text(v_artifact.payload -> 'swap' -> 'deactivate_keys')
  ) loop
    if exists (
      select 1 from public.tasks
      where user_id = v_user and template_task_key = v_key
        and state in ('not_started', 'in_progress')
    ) then
      v_open_swap := v_open_swap + 1;
    end if;
  end loop;

  if v_open_swap <> jsonb_array_length(v_artifact.payload -> 'swap' -> 'deactivate_keys') then
    raise exception 'swap_unavailable: mapped theory/contingency tasks must all still be open to preserve the 196-hour cap'
      using errcode = '22000';
  end if;

  -- Deactivate the mapped allocation with audit events.
  for v_row in
    select t.id, t.template_task_key, t.estimated_minutes
    from public.tasks t
    where t.user_id = v_user
      and t.template_task_key = any (
        select jsonb_array_elements_text(v_artifact.payload -> 'swap' -> 'deactivate_keys')
      )
      and t.state in ('not_started', 'in_progress')
    order by t.template_task_key
  loop
    update public.tasks
    set state = 'skipped',
        skip_reason = 'post_training_swap: replaced by the optional Post-Training track',
        revision = revision + 1
    where id = v_row.id;
    insert into public.task_events (user_id, task_id, event_type, metadata)
    values (
      v_user, v_row.id, 'skipped',
      jsonb_build_object(
        'reason', 'post_training_swap',
        'automated', true,
        'replaced_by', 'post_training_lab'
      )
    );
    v_deactivated := v_deactivated || v_row.id;
    v_keys := v_keys || v_row.template_task_key;
    v_minutes_deactivated := v_minutes_deactivated + v_row.estimated_minutes;
  end loop;

  if v_minutes_deactivated <> (v_artifact.payload -> 'swap' ->> 'deactivate_minutes')::int then
    raise exception 'swap_incomplete: deactivated % minutes, expected %',
      v_minutes_deactivated, v_artifact.payload -> 'swap' ->> 'deactivate_minutes'
      using errcode = '22000';
  end if;

  -- Activate Project 3 and flip the (irreversible) profile flag.
  update public.projects
  set state = 'active'
  where user_id = v_user and project_key = 'post_training_lab';

  update public.profiles
  set post_training_enabled = true
  where user_id = v_user;

  return jsonb_build_object(
    'status', 'ok',
    'deactivated_task_keys', to_jsonb(v_keys),
    'deactivated_minutes', v_minutes_deactivated,
    'activated_minutes', v_artifact.payload -> 'swap' -> 'activate_minutes',
    'activated_task_keys', v_artifact.payload -> 'swap' -> 'activate_keys'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: authenticated only; anon/public revoked.
-- ---------------------------------------------------------------------------

revoke all on function public.seed_plan_v1() from public, anon;
revoke all on function public.unlock_post_training(boolean) from public, anon;
grant execute on function public.seed_plan_v1() to authenticated;
grant execute on function public.unlock_post_training(boolean) to authenticated;
