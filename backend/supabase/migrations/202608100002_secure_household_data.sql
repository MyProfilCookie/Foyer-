-- Protection complete des donnees Foyer+ sans suppression de lignes.

-- Fonctions d'autorisation (SECURITY DEFINER evite la recursion RLS).
create or replace function public.current_user_email()
returns text language sql stable
as $$ select lower(trim(coalesce(auth.jwt() ->> 'email', ''))) $$;

create or replace function public.is_household_member(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.household_id = target_household
      and lower(trim(p.email)) = public.current_user_email()
  );
$$;

create or replace function public.is_household_owner(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.household_id = target_household
      and lower(trim(p.email)) = public.current_user_email()
      and p.role = 'owner'
  );
$$;

create or replace function public.has_section_access(target_household uuid, section_name text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.household_id = target_household
      and lower(trim(p.email)) = public.current_user_email()
      and (p.role = 'owner' or section_name = any(p.permissions))
  );
$$;

create or replace function public.is_own_parent(target_parent uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where p.id = target_parent
      and lower(trim(p.email)) = public.current_user_email()
  );
$$;

create or replace function public.household_has_no_parents(target_household uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select not exists (
    select 1 from public.parents p where p.household_id = target_household
  );
$$;

-- Permet a la page d'inscription de detecter une invitation sans exposer parents.
create or replace function public.has_pending_invite(candidate_email text)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.parents p
    where lower(trim(p.email)) = lower(trim(candidate_email))
  );
$$;

revoke all on function public.has_pending_invite(text) from public;
grant execute on function public.has_pending_invite(text) to anon, authenticated;

-- Empeche un membre de se promouvoir owner ou de changer ses autorisations.
create or replace function public.protect_parent_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if public.is_household_owner(old.household_id) then return new; end if;
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

drop trigger if exists protect_parent_privileges_trigger on public.parents;
create trigger protect_parent_privileges_trigger
before update on public.parents for each row
execute function public.protect_parent_privileges();

-- Activation RLS.
alter table public.households enable row level security;
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.events enable row level security;
alter table public.expenses enable row level security;
alter table public.homework enable row level security;
alter table public.journal_entries enable row level security;
alter table public.messages enable row level security;

-- Suppression des anciennes politiques connues.
drop policy if exists households_select on public.households;
drop policy if exists households_insert on public.households;
drop policy if exists households_update on public.households;
drop policy if exists parents_select on public.parents;
drop policy if exists parents_insert_self on public.parents;
drop policy if exists parents_insert_owner on public.parents;
drop policy if exists parents_update on public.parents;
drop policy if exists parents_delete on public.parents;
drop policy if exists children_select on public.children;
drop policy if exists children_write on public.children;
drop policy if exists events_all on public.events;
drop policy if exists expenses_all on public.expenses;
drop policy if exists homework_all on public.homework;
drop policy if exists journal_all on public.journal_entries;
drop policy if exists messages_all on public.messages;

-- Foyers : membres uniquement; creation par un utilisateur connecte.
create policy households_select on public.households for select to authenticated
using (public.is_household_member(id) or owner_id is null);
create policy households_insert on public.households for insert to authenticated
with check (true);
create policy households_update on public.households for update to authenticated
using (public.is_household_owner(id) or owner_id is null)
with check (public.is_household_owner(id) or public.is_own_parent(owner_id));

-- Parents : membres du meme foyer; gestion des invitations par le proprietaire.
create policy parents_select on public.parents for select to authenticated
using (public.is_household_member(household_id));
create policy parents_insert_self on public.parents for insert to authenticated
with check (
  lower(trim(email)) = public.current_user_email()
  and role = 'owner'
  and public.household_has_no_parents(household_id)
);
create policy parents_insert_owner on public.parents for insert to authenticated
with check (public.is_household_owner(household_id) and role = 'member');
create policy parents_update on public.parents for update to authenticated
using (public.is_household_owner(household_id) or lower(trim(email)) = public.current_user_email())
with check (public.is_household_member(household_id));
create policy parents_delete on public.parents for delete to authenticated
using (public.is_household_owner(household_id) and role <> 'owner');

-- Enfants : visibles par le foyer, modifiables par le proprietaire.
create policy children_select on public.children for select to authenticated
using (public.is_household_member(household_id));
create policy children_write on public.children for all to authenticated
using (public.is_household_owner(household_id))
with check (public.is_household_owner(household_id));

-- Sections : acces selon les permissions attribuees dans le profil.
create policy events_all on public.events for all to authenticated
using (public.has_section_access(household_id, 'calendar'))
with check (public.has_section_access(household_id, 'calendar'));
create policy expenses_all on public.expenses for all to authenticated
using (public.has_section_access(household_id, 'expenses'))
with check (public.has_section_access(household_id, 'expenses'));
create policy homework_all on public.homework for all to authenticated
using (public.has_section_access(household_id, 'homework'))
with check (public.has_section_access(household_id, 'homework'));
create policy journal_all on public.journal_entries for all to authenticated
using (public.has_section_access(household_id, 'journal'))
with check (public.has_section_access(household_id, 'journal'));
create policy messages_all on public.messages for all to authenticated
using (public.has_section_access(household_id, 'messages'))
with check (public.has_section_access(household_id, 'messages'));

-- Tickets prives. Les nouveaux fichiers utilisent household_id/nom-du-fichier.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do update set public = false;

-- Convertit les anciennes URL publiques en chemins de stockage.
update public.expenses
set receipt_url = substring(receipt_url from '/receipts/(.*)$')
where receipt_url like '%/receipts/%';

drop policy if exists "Anyone can upload receipts" on storage.objects;
drop policy if exists "Anyone can view receipts" on storage.objects;
drop policy if exists "Anyone can delete receipts" on storage.objects;
drop policy if exists receipts_select_household on storage.objects;
drop policy if exists receipts_insert_household on storage.objects;
drop policy if exists receipts_delete_household on storage.objects;

create policy receipts_select_household on storage.objects for select to authenticated
using (
  bucket_id = 'receipts'
  and public.has_section_access(((storage.foldername(name))[1])::uuid, 'expenses')
);
create policy receipts_insert_household on storage.objects for insert to authenticated
with check (
  bucket_id = 'receipts'
  and public.has_section_access(((storage.foldername(name))[1])::uuid, 'expenses')
);
create policy receipts_delete_household on storage.objects for delete to authenticated
using (
  bucket_id = 'receipts'
  and public.has_section_access(((storage.foldername(name))[1])::uuid, 'expenses')
);
