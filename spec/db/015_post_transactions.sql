-- Post writes that must land together (issue #93, PR #99 review). Number 015: 012 is #96, 013 is #99's tables, 014 is
-- the intake readers' (announced on issue #38). Depends on 002, 004 and 013 (posts.rev, post_candidates, post_decisions).
-- Must be applied with 013, before the Worker that drafts on the engine is deployed: the draft save and every edit,
-- approval and rejection call these functions. Safe to re-run.
-- Each function is one statement block, so Postgres runs it as one transaction: if any write fails, none lands.

-- A drafted post and every candidate the draft considered (create/ops.ts save_draft). Ids derive from the run, and rows
-- already present are left alone, so a retried step writes them once. Returns the post id.
create or replace function public.save_draft(p_post jsonb, p_candidates jsonb)
returns uuid language plpgsql security invoker set search_path = public as $fn$
begin
  insert into public.posts (id, brand_id, brief, channel, body, checks, status, model, kit_version)
  select r.id, r.brand_id, r.brief, r.channel, r.body, r.checks, r.status, r.model, r.kit_version
  from jsonb_populate_record(null::public.posts, p_post) r
  on conflict (id) do nothing;
  insert into public.post_candidates (id, run_id, brand_id, post_id, idx, chosen, body, claims, model, judge_model, prompt_versions, scores, verdict, retrieved, spec, kit_version)
  select c.id, c.run_id, c.brand_id, c.post_id, c.idx, c.chosen, c.body, coalesce(c.claims, '[]'), c.model, c.judge_model,
         coalesce(c.prompt_versions, '{}'), coalesce(c.scores, '{}'), coalesce(c.verdict, '{}'), coalesce(c.retrieved, '{}'), coalesce(c.spec, '{}'), c.kit_version
  from jsonb_populate_recordset(null::public.post_candidates, p_candidates) c
  on conflict (id) do nothing;
  return (p_post->>'id')::uuid;
end $fn$;
revoke all on function public.save_draft(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.save_draft(jsonb, jsonb) to service_role;

-- A change to a post and its decision-history row (posts.ts changePostWithDecision): the post changes only at the
-- revision read and in an allowed status (compare-and-swap, as changePost), and only then is the decision recorded.
-- Returns the changed post, or no row when the post changed meanwhile (the Worker answers 409).
create or replace function public.change_post_with_decision(p_post uuid, p_rev int, p_statuses text[], p_patch jsonb, p_decision jsonb)
returns setof public.posts language plpgsql security invoker set search_path = public as $fn$
declare v public.posts;
begin
  update public.posts set
    body = case when p_patch ? 'body' then p_patch->>'body' else body end,
    checks = case when p_patch ? 'checks' then p_patch->'checks' else checks end,
    status = case when p_patch ? 'status' then p_patch->>'status' else status end,
    approved_by = case when p_patch ? 'approved_by' then (p_patch->>'approved_by')::uuid else approved_by end,
    approved_at = case when p_patch ? 'approved_at' then (p_patch->>'approved_at')::timestamptz else approved_at end,
    rev = rev + 1
  where id = p_post and rev = p_rev and status = any(p_statuses)
  returning * into v;
  if not found then return; end if;
  insert into public.post_decisions (post_id, brand_id, kind, original, final, reason, note, decided_by)
  values (v.id, v.brand_id, p_decision->>'kind', p_decision->>'original', p_decision->>'final', p_decision->>'reason', p_decision->>'note', (p_decision->>'decided_by')::uuid);
  return next v;
end $fn$;
revoke all on function public.change_post_with_decision(uuid, int, text[], jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.change_post_with_decision(uuid, int, text[], jsonb, jsonb) to service_role;
