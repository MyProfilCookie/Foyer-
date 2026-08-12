-- Cree le foyer, son proprietaire et les enfants dans une transaction unique.
create or replace function public.create_household_with_owner(
  household_name text,
  owner_name text,
  children_data jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  authenticated_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  new_household_id uuid;
  new_owner_id uuid;
  child jsonb;
begin
  if auth.uid() is null or authenticated_email = '' then
    raise exception 'authentication_required';
  end if;

  if nullif(trim(household_name), '') is null
     or nullif(trim(owner_name), '') is null then
    raise exception 'invalid_household_data';
  end if;

  if exists (
    select 1 from public.parents p
    where lower(trim(p.email)) = authenticated_email
  ) then
    raise exception 'parent_already_exists';
  end if;

  insert into public.households (name)
  values (trim(household_name))
  returning id into new_household_id;

  insert into public.parents (household_id, name, email, role, permissions)
  values (
    new_household_id,
    trim(owner_name),
    authenticated_email,
    'owner',
    array['calendar', 'expenses', 'homework', 'journal', 'messages']::text[]
  )
  returning id into new_owner_id;

  update public.households set owner_id = new_owner_id where id = new_household_id;

  for child in
    select value from jsonb_array_elements(coalesce(children_data, '[]'::jsonb))
  loop
    if nullif(trim(child ->> 'name'), '') is not null then
      insert into public.children (household_id, name, birth_date)
      values (
        new_household_id,
        trim(child ->> 'name'),
        case
          when nullif(child ->> 'birth_date', '') is null then null
          else (child ->> 'birth_date')::date
        end
      );
    end if;
  end loop;

  return new_household_id;
end;
$$;

revoke all on function public.create_household_with_owner(text, text, jsonb) from public;
grant execute on function public.create_household_with_owner(text, text, jsonb) to authenticated;
