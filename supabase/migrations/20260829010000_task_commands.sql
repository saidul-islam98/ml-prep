-- Transactional task commands (todo.md Task 4a; WEBAPP_SPEC.md 10.10).
--
-- Security model:
--   * security definer with a fixed empty search_path and fully qualified
--     names, because the client role has NO direct INSERT/UPDATE on tasks or
--     task_events; these functions are the only write path.
--   * auth.uid() validated inside every function.
--   * Execution granted to authenticated only; revoked from anon/public.
--   * Every task mutation and its immutable event are written in the same
--     implicit transaction of the function call.
--   * Revision compare-and-swap: a stale expected_revision returns the latest
--     row (status "revision_conflict") instead of overwriting silently.

-- ---------------------------------------------------------------------------
-- create_custom_task
-- ---------------------------------------------------------------------------

create or replace function public.create_custom_task(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_title text;
  v_category text;
  v_scheduled_date date;
  v_estimated int;
  v_project_id uuid;
  v_role_tags text[];
  v_new_row public.tasks%rowtype;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  v_title := nullif(btrim(coalesce(p_payload ->> 'title', '')), '');
  if v_title is null or char_length(v_title) > 500 then
    raise exception 'invalid_payload: title must be 1-500 characters' using errcode = '22000';
  end if;

  v_category := p_payload ->> 'category';
  if v_category not in ('deep_work', 'practice', 'application', 'review') then
    raise exception 'invalid_payload: unknown category' using errcode = '22000';
  end if;

  if coalesce(p_payload ->> 'scheduled_date', '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception 'invalid_payload: scheduled_date must be YYYY-MM-DD' using errcode = '22000';
  end if;
  v_scheduled_date := (p_payload ->> 'scheduled_date')::date;

  if coalesce(p_payload ->> 'estimated_minutes', '') !~ '^\d+$' then
    raise exception 'invalid_payload: estimated_minutes must be a positive integer' using errcode = '22000';
  end if;
  v_estimated := (p_payload ->> 'estimated_minutes')::int;
  if v_estimated <= 0 then
    raise exception 'invalid_payload: estimated_minutes must be positive' using errcode = '22000';
  end if;

  if p_payload ? 'project_id' and p_payload ->> 'project_id' is not null then
    if coalesce(p_payload ->> 'project_id', '') !~ '^[0-9a-fA-F-]{36}$' then
      raise exception 'invalid_payload: project_id must be a UUID' using errcode = '22000';
    end if;
    v_project_id := (p_payload ->> 'project_id')::uuid;
  end if;

  v_role_tags := coalesce(
    array(select jsonb_array_elements_text(p_payload -> 'role_tags')),
    '{}'::text[]
  );

  insert into public.tasks (
    user_id, title, description, acceptance_note, category, role_tags,
    project_id, original_scheduled_date, scheduled_date, estimated_minutes,
    revision, state
  ) values (
    v_user, v_title, p_payload ->> 'description', p_payload ->> 'acceptance_note',
    v_category, v_role_tags, v_project_id, v_scheduled_date, v_scheduled_date,
    v_estimated, 0, 'not_started'
  )
  returning * into v_new_row;

  insert into public.task_events (user_id, task_id, event_type, metadata)
  values (
    v_user, v_new_row.id, 'created',
    jsonb_build_object(
      'category', v_category,
      'estimated_minutes', v_estimated,
      'scheduled_date', v_scheduled_date
    )
  );

  return jsonb_build_object('status', 'ok', 'task', to_jsonb(v_new_row));
end;
$$;

-- ---------------------------------------------------------------------------
-- transition_task
-- ---------------------------------------------------------------------------

create or replace function public.transition_task(
  p_task_id uuid,
  p_expected_revision integer,
  p_transition text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_task public.tasks%rowtype;
  v_new_state text;
  v_today date;
  v_to_date date;
  v_from_date date;
  v_actual int;
  v_allowed_fields text[] := array[]::text[];
  v_field text;
begin
  v_user := auth.uid();
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  if p_transition not in ('start', 'complete', 'reopen', 'reschedule', 'skip', 'edit', 'archive') then
    raise exception 'invalid_transition: unknown transition' using errcode = '22000';
  end if;

  -- Lock the task and enforce ownership in one statement. A missing row is
  -- identical for "not found" and "not owned" so ids are not leaked.
  select * into v_task
  from public.tasks
  where id = p_task_id and user_id = v_user
  for update;
  if not found then
    raise exception 'task_not_found' using errcode = '22000';
  end if;

  -- Expected-revision compare-and-swap: return the latest row for refresh.
  if p_expected_revision is null or p_expected_revision <> v_task.revision then
    return jsonb_build_object('status', 'revision_conflict', 'task', to_jsonb(v_task));
  end if;

  v_today := (now() at time zone 'America/Toronto')::date;

  case p_transition
    when 'start' then
      if v_task.state <> 'not_started' then
        raise exception 'invalid_transition: start requires state not_started (current: %)', v_task.state
          using errcode = '22000';
      end if;
      update public.tasks set state = 'in_progress', revision = revision + 1 where id = v_task.id
        returning * into v_task;
      insert into public.task_events (user_id, task_id, event_type)
        values (v_user, v_task.id, 'started');

    when 'complete' then
      if v_task.state not in ('not_started', 'in_progress') then
        raise exception 'invalid_transition: complete requires an open task (current: %)', v_task.state
          using errcode = '22000';
      end if;
      if coalesce(p_payload ->> 'actual_minutes', '') !~ '^\d+$' then
        raise exception 'invalid_payload: actual_minutes must be a positive integer'
          using errcode = '22000';
      end if;
      v_actual := (p_payload ->> 'actual_minutes')::int;
      if v_actual <= 0 then
        raise exception 'invalid_payload: actual_minutes must be positive' using errcode = '22000';
      end if;
      update public.tasks
        set state = 'completed', completed_at = now(), actual_minutes = v_actual, revision = revision + 1,
            evidence_url = coalesce(p_payload ->> 'evidence_url', v_task.evidence_url),
            evidence_note = coalesce(p_payload ->> 'evidence_note', v_task.evidence_note)
        where id = v_task.id
        returning * into v_task;
      insert into public.task_events (user_id, task_id, event_type, metadata)
        values (
          v_user, v_task.id, 'completed',
          jsonb_build_object('actual_minutes', v_actual)
        );

    when 'reopen' then
      if v_task.state = 'completed' then
        v_new_state := coalesce(p_payload ->> 'to_state', 'not_started');
        if v_new_state not in ('not_started', 'in_progress') then
          v_new_state := 'not_started';
        end if;
        update public.tasks
          set state = v_new_state, completed_at = null, actual_minutes = null, revision = revision + 1
          where id = v_task.id
          returning * into v_task;
        insert into public.task_events (user_id, task_id, event_type, metadata)
          values (v_user, v_task.id, 'reopened',
                  jsonb_build_object('from_state', 'completed', 'to_state', v_new_state));
      elsif v_task.state = 'skipped' then
        update public.tasks
          set state = 'not_started', skip_reason = null, revision = revision + 1
          where id = v_task.id
          returning * into v_task;
        insert into public.task_events (user_id, task_id, event_type, metadata)
          values (v_user, v_task.id, 'reopened', jsonb_build_object('from_state', 'skipped'));
      else
        raise exception 'invalid_transition: reopen requires state completed or skipped (current: %)',
          v_task.state using errcode = '22000';
      end if;

    when 'reschedule' then
      if v_task.state not in ('not_started', 'in_progress') then
        raise exception 'invalid_transition: reschedule requires an open task (current: %)', v_task.state
          using errcode = '22000';
      end if;
      if coalesce(p_payload ->> 'to_date', '') !~ '^\d{4}-\d{2}-\d{2}$' then
        raise exception 'invalid_payload: to_date must be YYYY-MM-DD' using errcode = '22000';
      end if;
      v_to_date := (p_payload ->> 'to_date')::date;
      if v_to_date < v_today then
        raise exception 'invalid_date: destination must be today or later (Toronto time)'
          using errcode = '22000';
      end if;
      if v_to_date = v_task.scheduled_date then
        raise exception 'invalid_date: destination equals the current scheduled date'
          using errcode = '22000';
      end if;
      v_from_date := v_task.scheduled_date;
      update public.tasks set scheduled_date = v_to_date, revision = revision + 1 where id = v_task.id
        returning * into v_task;
      insert into public.task_events
        (user_id, task_id, event_type, from_scheduled_date, to_scheduled_date, metadata)
        values (v_user, v_task.id, 'rescheduled', v_from_date, v_to_date,
                jsonb_build_object('reason', p_payload ->> 'reason'));

    when 'skip' then
      if v_task.state not in ('not_started', 'in_progress') then
        raise exception 'invalid_transition: skip requires an open task (current: %)', v_task.state
          using errcode = '22000';
      end if;
      if nullif(btrim(coalesce(p_payload ->> 'reason', '')), '') is null then
        raise exception 'invalid_payload: skip requires a reason' using errcode = '22000';
      end if;
      update public.tasks set state = 'skipped', skip_reason = p_payload ->> 'reason', revision = revision + 1
        where id = v_task.id
        returning * into v_task;
      insert into public.task_events (user_id, task_id, event_type, metadata)
        values (v_user, v_task.id, 'skipped', jsonb_build_object('reason', p_payload ->> 'reason'));

    when 'archive' then
      if v_task.template_task_key is not null then
        raise exception 'invalid_transition: template tasks cannot be archived'
          using errcode = '22000';
      end if;
      if v_task.state not in ('not_started', 'in_progress') then
        raise exception 'invalid_transition: archive requires an open task (current: %)', v_task.state
          using errcode = '22000';
      end if;
      if nullif(btrim(coalesce(p_payload ->> 'reason', '')), '') is null then
        raise exception 'invalid_payload: archive requires a reason' using errcode = '22000';
      end if;
      update public.tasks set state = 'archived', revision = revision + 1 where id = v_task.id
        returning * into v_task;
      insert into public.task_events (user_id, task_id, event_type, metadata)
        values (v_user, v_task.id, 'archived', jsonb_build_object('reason', p_payload ->> 'reason'));

    when 'edit' then
      -- Allowed fields. Evidence may be edited in any state; content and
      -- estimate fields only on open tasks (8.3).
      v_allowed_fields := array(
        select jsonb_object_keys(p_payload)
      );
      if v_allowed_fields = array[]::text[] then
        raise exception 'invalid_payload: edit requires at least one field' using errcode = '22000';
      end if;
      foreach v_field in array v_allowed_fields loop
        if v_field not in (
          'title', 'description', 'acceptance_note', 'estimated_minutes',
          'category', 'role_tags', 'evidence_url', 'evidence_note'
        ) then
          raise exception 'invalid_payload: field % is not editable', v_field
            using errcode = '22000';
        end if;
      end loop;
      if v_task.state not in ('not_started', 'in_progress') then
        foreach v_field in array v_allowed_fields loop
          if v_field not in ('evidence_url', 'evidence_note') then
            raise exception 'invalid_transition: field % is only editable on open tasks', v_field
              using errcode = '22000';
          end if;
        end loop;
      end if;

      update public.tasks set
        title = coalesce(p_payload ->> 'title', v_task.title),
        description = case when p_payload ? 'description' then p_payload ->> 'description' else v_task.description end,
        acceptance_note = case when p_payload ? 'acceptance_note' then p_payload ->> 'acceptance_note' else v_task.acceptance_note end,
        estimated_minutes = case
          when p_payload ? 'estimated_minutes' then (p_payload ->> 'estimated_minutes')::int
          else v_task.estimated_minutes end,
        category = case when p_payload ? 'category' then p_payload ->> 'category' else v_task.category end,
        role_tags = case
          when jsonb_typeof(p_payload -> 'role_tags') = 'array'
            then array(select jsonb_array_elements_text(p_payload -> 'role_tags'))::text[]
          else v_task.role_tags end,
        evidence_url = case when p_payload ? 'evidence_url' then p_payload ->> 'evidence_url' else v_task.evidence_url end,
        evidence_note = case when p_payload ? 'evidence_note' then p_payload ->> 'evidence_note' else v_task.evidence_note end,
        revision = revision + 1
      where id = v_task.id
      returning * into v_task;

      insert into public.task_events (user_id, task_id, event_type, metadata)
        values (v_user, v_task.id, 'edited',
                jsonb_build_object('fields', to_jsonb(v_allowed_fields)));
  end case;

  return jsonb_build_object('status', 'ok', 'task', to_jsonb(v_task));
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: authenticated only; anon/public revoked.
-- ---------------------------------------------------------------------------

revoke all on function public.create_custom_task(jsonb) from public, anon;
revoke all on function public.transition_task(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.create_custom_task(jsonb) to authenticated;
grant execute on function public.transition_task(uuid, integer, text, jsonb) to authenticated;
