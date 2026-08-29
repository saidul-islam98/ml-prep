-- Practice links (todo.md Task 12): create_custom_task gains an optional
-- source_practice_session_id so correction tasks can carry an owner-safe
-- link to their practice session. The composite owner foreign key
-- (source_practice_session_id, user_id) rejects cross-owner references.

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
  v_practice_session_id uuid;
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

  if p_payload ? 'source_practice_session_id' and p_payload ->> 'source_practice_session_id' is not null then
    if coalesce(p_payload ->> 'source_practice_session_id', '') !~ '^[0-9a-fA-F-]{36}$' then
      raise exception 'invalid_payload: source_practice_session_id must be a UUID' using errcode = '22000';
    end if;
    v_practice_session_id := (p_payload ->> 'source_practice_session_id')::uuid;
  end if;

  v_role_tags := coalesce(
    array(select jsonb_array_elements_text(p_payload -> 'role_tags')),
    '{}'::text[]
  );

  insert into public.tasks (
    user_id, title, description, acceptance_note, category, role_tags,
    project_id, original_scheduled_date, scheduled_date, estimated_minutes,
    revision, state, source_practice_session_id
  ) values (
    v_user, v_title, p_payload ->> 'description', p_payload ->> 'acceptance_note',
    v_category, v_role_tags, v_project_id, v_scheduled_date, v_scheduled_date,
    v_estimated, 0, 'not_started', v_practice_session_id
  )
  returning * into v_new_row;

  insert into public.task_events (user_id, task_id, event_type, metadata)
  values (
    v_user, v_new_row.id, 'created',
    jsonb_build_object(
      'category', v_category,
      'estimated_minutes', v_estimated,
      'scheduled_date', v_scheduled_date,
      'source_practice_session_id', v_practice_session_id
    )
  );

  return jsonb_build_object('status', 'ok', 'task', to_jsonb(v_new_row));
end;
$$;

revoke all on function public.create_custom_task(jsonb) from public, anon;
grant execute on function public.create_custom_task(jsonb) to authenticated;
