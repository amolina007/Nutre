-- Nutre: private personal records and explicitly shared recipes/plans.
-- Development and production have independent tables; identity is shared Aura Auth.
create function public.nutre_valid_document(k text, d jsonb) returns boolean
language plpgsql immutable security invoker set search_path = pg_catalog as $$
declare i jsonb; e jsonb; s jsonb;
begin
 if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>100000 then return false; end if;
 if k in ('pantry','shopping') then
  if jsonb_typeof(d->'name') is distinct from 'string' or length(trim(d->>'name')) not between 1 and 100 then return false; end if;
  if jsonb_typeof(d->'quantity') is distinct from 'number' or (d->>'quantity')::numeric not between 0.01 and 100000 then return false; end if;
  if coalesce(d->>'unit','') not in ('unidades','g','kg','ml','l') then return false; end if;
  if k='pantry' then
   if coalesce(d->>'location','') not in ('Despensa','Refrigerador','Congelador') then return false; end if;
   if d->>'expiry' is not null then
    if (d->>'expiry') !~ '^\d{4}-\d{2}-\d{2}$' then return false; end if;
    perform (d->>'expiry')::date;
   end if;
  elsif jsonb_typeof(d->'checked') is distinct from 'boolean' then return false; end if;
 elsif k='recipe' then
  if jsonb_typeof(d->'title') is distinct from 'string' or length(trim(d->>'title')) not between 1 and 120 then return false; end if;
  if jsonb_typeof(d->'author') is distinct from 'string' or length(trim(d->>'author')) not between 1 and 80 then return false; end if;
  if jsonb_typeof(d->'description') is distinct from 'string' or length(d->>'description')>1000 then return false; end if;
  if jsonb_typeof(d->'minutes') is distinct from 'number' or (d->>'minutes')::numeric not between 1 and 1440 then return false; end if;
  if jsonb_typeof(d->'servings') is distinct from 'number' or (d->>'servings')::numeric not between 1 and 50 then return false; end if;
  if jsonb_typeof(d->'ingredients') is distinct from 'array' or jsonb_array_length(d->'ingredients') not between 1 and 40 then return false; end if;
  for i in select value from jsonb_array_elements(d->'ingredients') loop
   if jsonb_typeof(i->'name') is distinct from 'string' or length(trim(i->>'name')) not between 1 and 100 or jsonb_typeof(i->'quantity') is distinct from 'number' or (i->>'quantity')::numeric not between 0.01 and 100000 or coalesce(i->>'unit','') not in ('unidades','g','kg','ml','l') then return false; end if;
  end loop;
  if jsonb_typeof(d->'steps') is distinct from 'array' or jsonb_array_length(d->'steps') not between 1 and 100 then return false; end if;
  for s in select value from jsonb_array_elements(d->'steps') loop
   if jsonb_typeof(s) is distinct from 'string' or length(s #>> '{}') not between 1 and 2000 then return false; end if;
  end loop;
 elsif k='plan' then
  if jsonb_typeof(d->'title') is distinct from 'string' or length(trim(d->>'title')) not between 1 and 140 or jsonb_typeof(d->'author') is distinct from 'string' or length(d->>'author') not between 1 and 80 then return false; end if;
  if jsonb_typeof(d->'description') is distinct from 'string' or length(d->>'description')>1000 then return false; end if;
  if jsonb_typeof(d->'entries') is distinct from 'array' or jsonb_array_length(d->'entries')>100 then return false; end if;
  for e in select value from jsonb_array_elements(d->'entries') loop
   if (e->>'day') !~ '^[0-6]$' or e->>'day' is null or coalesce(e->>'meal','') not in ('Desayuno','Almuerzo','Cena','Colación') or jsonb_typeof(e->'servings') is distinct from 'number' or (e->>'servings')::numeric not between 1 and 50 then return false; end if;
   if not public.nutre_valid_document('recipe',(e->'snapshot')||jsonb_build_object('minutes',1,'description','')) then return false; end if;
  end loop;
 elsif k='favorite' then
  if jsonb_typeof(d->'recipeId') is distinct from 'string' or length(d->>'recipeId') not between 1 and 80 then return false; end if;
 elsif k='progress' then
  if coalesce(d->>'lessonId','') not in ('organizar','cortes','despensa') then return false; end if;
 else return false;
 end if;
 return true;
exception when others then return false;
end $$;
revoke all on function public.nutre_valid_document(text,jsonb) from public;
grant execute on function public.nutre_valid_document(text,jsonb) to authenticated;

do $$
declare t text;
begin
 foreach t in array array['nutre_documents','nutre_dev_documents'] loop
 execute format('create table public.%I (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check (kind in (''pantry'',''recipe'',''plan'',''shopping'',''favorite'',''progress'')),
 data jsonb not null check (public.nutre_valid_document(kind,data)),
 is_public boolean not null default false check (not is_public or kind in (''recipe'',''plan'')),
 created_at timestamptz not null default now()
 )',t);
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to anon',t);
 execute format('grant select, insert, update, delete on public.%I to authenticated',t);
 execute format('create policy owner_select on public.%I for select to authenticated using (user_id=(select auth.uid()))',t);
 execute format('create policy published_select on public.%I for select to anon, authenticated using (is_public and kind in (''recipe'',''plan''))',t);
 execute format('create policy owner_insert on public.%I for insert to authenticated with check (user_id=(select auth.uid()))',t);
 execute format('create policy owner_update on public.%I for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()))',t);
 execute format('create policy owner_delete on public.%I for delete to authenticated using (user_id=(select auth.uid()))',t);
 execute format('create index %I on public.%I (user_id,kind,created_at desc)',t||'_owner_idx',t);
 execute format('create index %I on public.%I (created_at desc) where is_public',t||'_public_idx',t);
 execute format('create unique index %I on public.%I (user_id,(data->>''recipeId'')) where kind=''favorite''',t||'_favorite_idx',t);
 execute format('create unique index %I on public.%I (user_id,(data->>''lessonId'')) where kind=''progress''',t||'_progress_idx',t);
 end loop;
end $$;
