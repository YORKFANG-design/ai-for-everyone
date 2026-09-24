begin;

-- auth.users is the basic user record managed by Supabase (Google and Email).
-- A saved workflow contains the request and its latest edited result atomically.
create table public.workflow_runs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  request jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_request check (coalesce((
    jsonb_typeof(request) = 'object'
    and request @> '{"version":1}'::jsonb
    and request->>'task' in ('reply', 'summary', 'plan')
    and jsonb_typeof(request->'input') = 'string'
    and length(btrim(request->>'input')) between 1 and 12000
    and jsonb_typeof(request->'clarification') = 'string'
    and length(request->>'clarification') <= 2000
    and request ?& array['version','task','input','clarification']
  ), false)),
  constraint valid_result check (coalesce((
    jsonb_typeof(result) = 'object'
    and result ? 'kind'
    and result->>'kind' = request->>'task'
    and octet_length(result::text) <= 200000
    and case result->>'kind'
      when 'reply' then result ? 'text' and jsonb_typeof(result->'text') = 'string' and length(btrim(result->>'text')) between 1 and 6000
      when 'summary' then result ?& array['summary','keyPoints','actions'] and jsonb_typeof(result->'summary') = 'string' and jsonb_typeof(result->'keyPoints') = 'array' and jsonb_typeof(result->'actions') = 'array'
      when 'plan' then result ?& array['goal','steps'] and jsonb_typeof(result->'goal') = 'string' and jsonb_typeof(result->'steps') = 'array'
      else false
    end
  ), false))
);
create index workflow_runs_recent on public.workflow_runs(user_id, updated_at desc);
alter table public.workflow_runs enable row level security;
alter table public.workflow_runs force row level security;
revoke all on public.workflow_runs from anon;
grant select, insert, update on public.workflow_runs to authenticated;
create policy read_own_work on public.workflow_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy insert_own_work on public.workflow_runs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy update_own_work on public.workflow_runs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.save_workflow(work_id uuid, work_request jsonb, work_result jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  insert into public.workflow_runs(id, user_id, request, result)
    values (work_id, auth.uid(), work_request, work_result)
  on conflict (id) do update set request = excluded.request, result = excluded.result, updated_at = now();
  return work_id;
end;
$$;
revoke all on function public.save_workflow(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_workflow(uuid, jsonb, jsonb) to authenticated;

commit;
