-- Expand only the dev health condition allowlist; existing permissions are retained.
create or replace function public.nutre_dev_valid_household(d jsonb) returns boolean
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
  if jsonb_typeof(p->'conditions') is distinct from 'array' or jsonb_array_length(p->'conditions')>6 then return false;end if;
  for s in select value from jsonb_array_elements(p->'conditions') loop
   if coalesce(s#>>'{}','') not in ('diabetes1','diabetes2','gestational','hypertension','dyslipidemia','other') then return false;end if;
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
