-- Ajoute des administrateurs multiples et reserve les suppressions aux admins.

alter table public.parents drop constraint if exists parents_role_check;
alter table public.parents
  add constraint parents_role_check check (role in ('owner', 'admin', 'member'));

create or replace function public.is_household_admin(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.household_id = target_household
      and lower(trim(p.email)) = public.current_user_email()
      and p.role in ('owner', 'admin')
  );
$$;

create or replace function public.has_section_access(target_household uuid, section_name text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.household_id = target_household
      and lower(trim(p.email)) = public.current_user_email()
      and (p.role in ('owner', 'admin') or section_name = any(p.permissions))
  );
$$;

create or replace function public.protect_parent_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  -- Le proprietaire principal peut tout administrer.
  if public.is_household_owner(old.household_id) then return new; end if;

  -- Un admin peut gerer membres et admins, mais jamais modifier le proprietaire.
  if public.is_household_admin(old.household_id) then
    if old.role = 'owner' or new.role = 'owner' then
      raise exception 'Le proprietaire principal ne peut pas etre modifie.';
    end if;
    if new.household_id is distinct from old.household_id
       or lower(trim(new.email)) is distinct from lower(trim(old.email)) then
      raise exception 'Le foyer et l email du membre ne peuvent pas etre modifies.';
    end if;
    return new;
  end if;

  -- Un membre peut uniquement modifier ses informations non sensibles.
  if lower(trim(old.email)) <> public.current_user_email() then
    raise exception 'Modification de membre non autorisee.';
  end if;
  if new.role is distinct from old.role
     or new.permissions is distinct from old.permissions
     or new.household_id is distinct from old.household_id
     or lower(trim(new.email)) is distinct from lower(trim(old.email)) then
    raise exception 'Modification des autorisations interdite.';
  end if;
  return new;
end;
$$;

-- Administration du foyer et des membres.
drop policy if exists households_update on public.households;
create policy households_update on public.households for update to authenticated
using (public.is_household_admin(id) or owner_id is null)
with check (public.is_household_admin(id) or public.is_own_parent(owner_id));

drop policy if exists parents_insert_owner on public.parents;
drop policy if exists parents_insert_admin on public.parents;
create policy parents_insert_admin on public.parents for insert to authenticated
with check (
  public.is_household_admin(household_id)
  and role in ('member', 'admin')
);

drop policy if exists parents_update on public.parents;
create policy parents_update on public.parents for update to authenticated
using (public.is_household_admin(household_id) or lower(trim(email)) = public.current_user_email())
with check (public.is_household_member(household_id));

drop policy if exists parents_delete on public.parents;
create policy parents_delete on public.parents for delete to authenticated
using (public.is_household_admin(household_id) and role <> 'owner');

drop policy if exists children_write on public.children;
create policy children_write on public.children for all to authenticated
using (public.is_household_admin(household_id))
with check (public.is_household_admin(household_id));

-- Remplace les politiques globales par des droits distincts.
drop policy if exists events_all on public.events;
drop policy if exists events_read on public.events;
drop policy if exists events_insert on public.events;
drop policy if exists events_update on public.events;
drop policy if exists events_delete_admin on public.events;
create policy events_read on public.events for select to authenticated using (public.has_section_access(household_id, 'calendar'));
create policy events_insert on public.events for insert to authenticated with check (public.has_section_access(household_id, 'calendar'));
create policy events_update on public.events for update to authenticated using (public.has_section_access(household_id, 'calendar')) with check (public.has_section_access(household_id, 'calendar'));
create policy events_delete_admin on public.events for delete to authenticated using (public.is_household_admin(household_id));

drop policy if exists expenses_all on public.expenses;
drop policy if exists expenses_read on public.expenses;
drop policy if exists expenses_insert on public.expenses;
drop policy if exists expenses_update on public.expenses;
drop policy if exists expenses_delete_admin on public.expenses;
create policy expenses_read on public.expenses for select to authenticated using (public.has_section_access(household_id, 'expenses'));
create policy expenses_insert on public.expenses for insert to authenticated with check (public.has_section_access(household_id, 'expenses'));
create policy expenses_update on public.expenses for update to authenticated using (public.has_section_access(household_id, 'expenses')) with check (public.has_section_access(household_id, 'expenses'));
create policy expenses_delete_admin on public.expenses for delete to authenticated using (public.is_household_admin(household_id));

drop policy if exists homework_all on public.homework;
drop policy if exists homework_read on public.homework;
drop policy if exists homework_insert on public.homework;
drop policy if exists homework_update on public.homework;
drop policy if exists homework_delete_admin on public.homework;
create policy homework_read on public.homework for select to authenticated using (public.has_section_access(household_id, 'homework'));
create policy homework_insert on public.homework for insert to authenticated with check (public.has_section_access(household_id, 'homework'));
create policy homework_update on public.homework for update to authenticated using (public.has_section_access(household_id, 'homework')) with check (public.has_section_access(household_id, 'homework'));
create policy homework_delete_admin on public.homework for delete to authenticated using (public.is_household_admin(household_id));

drop policy if exists journal_all on public.journal_entries;
drop policy if exists journal_read on public.journal_entries;
drop policy if exists journal_insert on public.journal_entries;
drop policy if exists journal_update on public.journal_entries;
drop policy if exists journal_delete_admin on public.journal_entries;
create policy journal_read on public.journal_entries for select to authenticated using (public.has_section_access(household_id, 'journal'));
create policy journal_insert on public.journal_entries for insert to authenticated with check (public.has_section_access(household_id, 'journal'));
create policy journal_update on public.journal_entries for update to authenticated using (public.has_section_access(household_id, 'journal')) with check (public.has_section_access(household_id, 'journal'));
create policy journal_delete_admin on public.journal_entries for delete to authenticated using (public.is_household_admin(household_id));

drop policy if exists messages_all on public.messages;
drop policy if exists messages_read on public.messages;
drop policy if exists messages_insert on public.messages;
drop policy if exists messages_update on public.messages;
drop policy if exists messages_delete_admin on public.messages;
create policy messages_read on public.messages for select to authenticated using (public.has_section_access(household_id, 'messages'));
create policy messages_insert on public.messages for insert to authenticated with check (public.has_section_access(household_id, 'messages'));
create policy messages_update on public.messages for update to authenticated using (public.has_section_access(household_id, 'messages')) with check (public.has_section_access(household_id, 'messages'));
create policy messages_delete_admin on public.messages for delete to authenticated using (public.is_household_admin(household_id));
