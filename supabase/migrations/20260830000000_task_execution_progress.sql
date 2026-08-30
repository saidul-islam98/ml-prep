-- Durable, user-owned execution state for curriculum tasks.
create table public.task_execution_progress (
  task_id uuid primary key,
  user_id uuid not null,
  completed_todo_ids text[] not null default '{}',
  completed_criterion_ids text[] not null default '{}',
  opened_resource_ids text[] not null default '{}',
  current_step_index integer not null default 0 check (current_step_index >= 0),
  elapsed_seconds integer not null default 0 check (elapsed_seconds >= 0),
  timer_started_at timestamptz,
  step_notes jsonb not null default '{}'::jsonb check (jsonb_typeof(step_notes) = 'object'),
  reflection_note text,
  started_at timestamptz,
  paused_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint task_execution_progress_task_owner_fk foreign key (task_id, user_id)
    references public.tasks(id, user_id) on delete cascade
);

alter table public.task_execution_progress enable row level security;

create policy task_execution_progress_select_own on public.task_execution_progress
  for select using (user_id = auth.uid());
create policy task_execution_progress_insert_own on public.task_execution_progress
  for insert with check (user_id = auth.uid());
create policy task_execution_progress_update_own on public.task_execution_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on table public.task_execution_progress from public, anon;
grant select, insert, update on table public.task_execution_progress to authenticated;

-- UI completion calls this wrapper so gate verification and override rationale
-- are captured separately from evidence notes in the immutable event history.
create or replace function public.complete_task_with_gate(
  p_task_id uuid,
  p_expected_revision integer,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_task public.tasks%rowtype;
  v_result jsonb;
  v_override text := nullif(btrim(coalesce(p_payload ->> 'completion_override_reason', '')), '');
  v_verified boolean := coalesce((p_payload ->> 'completion_gate_verified')::boolean, false);
begin
  if v_user is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  select * into v_task
  from public.tasks
  where id = p_task_id and user_id = v_user;

  if not found then
    raise exception 'task_not_found' using errcode = '22000';
  end if;

  if v_task.template_task_key is not null and not v_verified and v_override is null then
    raise exception 'completion_gate_required: check every required criterion or provide an override reason'
      using errcode = '22000';
  end if;

  v_result := public.transition_task(
    p_task_id,
    p_expected_revision,
    'complete',
    p_payload - 'completion_override_reason' - 'completion_gate_verified'
      - 'completed_criterion_ids' - 'elapsed_seconds'
  );

  if v_result ->> 'status' = 'ok' then
    update public.task_events
    set metadata = metadata || jsonb_strip_nulls(jsonb_build_object(
      'completion_gate_verified', v_verified,
      'completion_override_reason', v_override,
      'completed_criterion_ids', p_payload -> 'completed_criterion_ids',
      'elapsed_seconds', p_payload -> 'elapsed_seconds'
    ))
    where id = (
      select id from public.task_events
      where task_id = p_task_id and user_id = v_user and event_type = 'completed'
      order by occurred_at desc, id desc limit 1
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.complete_task_with_gate(uuid, integer, jsonb) from public, anon;
grant execute on function public.complete_task_with_gate(uuid, integer, jsonb) to authenticated;
