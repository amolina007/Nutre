-- Development only. Health profiles never enter shareable recipe/plan documents.
create function public.nutre_dev_valid_household(d jsonb) returns boolean
language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare p jsonb; m jsonb; s jsonb; ids text[] := array[]::text[]; seen text[];
begin
 if jsonb_typeof(d) is distinct from 'object' or octet_length(d::text)>300000 then return false;end if;
 if jsonb_typeof(d->'people') is distinct from 'array' or jsonb_array_length(d->'people')>20 or jsonb_typeof(d->'meals') is distinct from 'object' then return false;end if;
 for p in select value from jsonb_array_elements(d->'people') loop
  if jsonb_typeof(p->'id') is distinct from 'string' or (p->>'id') !~ '^[0-9a-f-]{36}$' or (p->>'id')=any(ids) then return false;end if;
  ids:=array_append(ids,p->>'id');
  if jsonb_typeof(p->'alias') is distinct from 'string' or length(trim(p->>'alias')) not between 1 and 60 then return false;end if;
  if jsonb_typeof(p->'ageMonths') is distinct from 'number' or (p->>'ageMonths') !~ '^\d+$' or (p->>'ageMonths')::int not between 0 and 1440 then return false;end if;
  if coalesce(p->>'ageRecordedOn','') !~ '^\d{4}-\d{2}-\d{2}$' then return false;end if;
  perform (p->>'ageRecordedOn')::date;
  if jsonb_typeof(p->'conditions') is distinct from 'array' or jsonb_array_length(p->'conditions')>4 then return false;end if;
  for s in select value from jsonb_array_elements(p->'conditions') loop
   if coalesce(s#>>'{}','') not in ('diabetes1','diabetes2','gestational','other') then return false;end if;
  end loop;
  if jsonb_typeof(p->'allergies') is distinct from 'array' or jsonb_array_length(p->'allergies')>20 then return false;end if;
  for s in select value from jsonb_array_elements(p->'allergies') loop
   if jsonb_typeof(s) is distinct from 'string' or length(s#>>'{}') not between 1 and 100 then return false;end if;
  end loop;
  if jsonb_typeof(p->'notes') is distinct from 'string' or length(p->>'notes')>1000 or jsonb_typeof(p->'preferences') is distinct from 'string' or length(p->>'preferences')>300 then return false;end if;
 end loop;
 if (select count(*) from jsonb_each(d->'meals'))>1000 then return false;end if;
 for m in select value from jsonb_each(d->'meals') loop
  if jsonb_typeof(m->'selections') is distinct from 'array' or jsonb_array_length(m->'selections') not between 1 and 20 then return false;end if;
  seen:=array[]::text[];
  for s in select value from jsonb_array_elements(m->'selections') loop
   if not coalesce((s->>'personId')=any(ids),false) or (s->>'personId')=any(seen) or jsonb_typeof(s->'portions') is distinct from 'number' or (s->>'portions')::numeric not between 0.01 and 50 then return false;end if;
   seen:=array_append(seen,s->>'personId');
  end loop;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function public.nutre_dev_valid_household(jsonb) from public;
grant execute on function public.nutre_dev_valid_household(jsonb) to authenticated;
create table public.nutre_dev_households (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null check(public.nutre_dev_valid_household(data)),
 revision integer not null default 1 check(revision>0)
);
alter table public.nutre_dev_households enable row level security;
revoke all on public.nutre_dev_households from anon,authenticated;
grant select,insert,update,delete on public.nutre_dev_households to authenticated;
create policy owner_select on public.nutre_dev_households for select to authenticated using(user_id=(select auth.uid()));
create policy owner_insert on public.nutre_dev_households for insert to authenticated with check(user_id=(select auth.uid()));
create policy owner_update on public.nutre_dev_households for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy owner_delete on public.nutre_dev_households for delete to authenticated using(user_id=(select auth.uid()));
-- Permit explicitly chosen fractional servings only in development plans.
-- Validate every other field against the established Nutre validator.
create function public.nutre_dev_valid_document(k text,d jsonb) returns boolean
language plpgsql immutable security invoker set search_path=pg_catalog as $$
declare e jsonb; entries jsonb := '[]'::jsonb;
begin
 if k<>'plan' then return public.nutre_valid_document(k,d);end if;
 if jsonb_typeof(d->'entries') is distinct from 'array' then return false;end if;
 for e in select value from jsonb_array_elements(d->'entries') loop
  if jsonb_typeof(e->'servings') is distinct from 'number' or (e->>'servings')::numeric not between 0.01 and 50 then return false;end if;
  entries:=entries||jsonb_build_array(e||jsonb_build_object('servings',greatest(1,(e->>'servings')::numeric)));
 end loop;
 return public.nutre_valid_document(k,d||jsonb_build_object('entries',entries));
exception when others then return false;
end $$;
revoke all on function public.nutre_dev_valid_document(text,jsonb) from public;
grant execute on function public.nutre_dev_valid_document(text,jsonb) to authenticated;
alter table public.nutre_dev_documents drop constraint nutre_dev_documents_check;
alter table public.nutre_dev_documents add constraint nutre_dev_documents_check check(public.nutre_dev_valid_document(kind,data));
