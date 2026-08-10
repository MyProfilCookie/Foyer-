-- Reconcile columns already in use by the app but missing from the tracked schema.
alter table households add column if not exists owner_id uuid references parents(id) on delete set null;
alter table parents add column if not exists role text not null default 'member';
alter table parents add column if not exists permissions text[] not null default '{}';

-- New: cosmetic relationship label (parent, grand-parent, frère/sœur, aidant, ...).
-- Not used for access control -- that stays driven by role + permissions.
alter table parents add column if not exists relationship text not null default 'parent';

-- Collapse the old 'parent' role (implicit full access) into 'member' with explicit
-- full permissions, so existing co-parents keep the access they already have.
update parents set permissions = array['calendar', 'expenses', 'homework', 'journal', 'messages']
  where role = 'parent';
update parents set role = 'member' where role = 'parent';

alter table parents drop constraint if exists parents_role_check;
alter table parents add constraint parents_role_check check (role in ('owner', 'member'));

-- Seat limit: at most 4 people (owner included) per household.
create or replace function enforce_household_seat_limit() returns trigger as $$
begin
  if (select count(*) from parents where household_id = new.household_id) >= 4 then
    raise exception 'household_seat_limit_reached';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_household_seat_limit on parents;
create trigger trg_household_seat_limit
  before insert on parents
  for each row execute function enforce_household_seat_limit();

-- --- Row Level Security ---

create or replace function is_household_member(target_household uuid) returns boolean as $$
  select exists (
    select 1 from parents p
    where p.household_id = target_household and p.email = auth.jwt() ->> 'email'
  );
$$ language sql stable security definer set search_path = public;

create or replace function is_household_owner(target_household uuid) returns boolean as $$
  select exists (
    select 1 from parents p
    where p.household_id = target_household and p.email = auth.jwt() ->> 'email' and p.role = 'owner'
  );
$$ language sql stable security definer set search_path = public;

create or replace function has_section_access(target_household uuid, section text) returns boolean as $$
  select exists (
    select 1 from parents p
    where p.household_id = target_household
      and p.email = auth.jwt() ->> 'email'
      and (p.role = 'owner' or section = any(p.permissions))
  );
$$ language sql stable security definer set search_path = public;

alter table households enable row level security;
alter table parents enable row level security;
alter table children enable row level security;
alter table events enable row level security;
alter table expenses enable row level security;
alter table homework enable row level security;
alter table journal_entries enable row level security;
alter table messages enable row level security;

drop policy if exists households_select on households;
create policy households_select on households for select using (is_household_member(id));
drop policy if exists households_insert on households;
create policy households_insert on households for insert with check (auth.role() = 'authenticated');
drop policy if exists households_update on households;
create policy households_update on households for update using (is_household_owner(id));

drop policy if exists parents_select on parents;
create policy parents_select on parents for select using (is_household_member(household_id));
drop policy if exists parents_insert_self on parents;
create policy parents_insert_self on parents for insert with check (email = auth.jwt() ->> 'email');
drop policy if exists parents_insert_owner on parents;
create policy parents_insert_owner on parents for insert with check (is_household_owner(household_id));
drop policy if exists parents_update on parents;
create policy parents_update on parents for update using (is_household_owner(household_id) or email = auth.jwt() ->> 'email');
drop policy if exists parents_delete on parents;
create policy parents_delete on parents for delete using (is_household_owner(household_id));

drop policy if exists children_select on children;
create policy children_select on children for select using (is_household_member(household_id));
drop policy if exists children_write on children;
create policy children_write on children for all
  using (is_household_owner(household_id))
  with check (is_household_owner(household_id));

drop policy if exists events_all on events;
create policy events_all on events for all
  using (has_section_access(household_id, 'calendar'))
  with check (has_section_access(household_id, 'calendar'));

drop policy if exists expenses_all on expenses;
create policy expenses_all on expenses for all
  using (has_section_access(household_id, 'expenses'))
  with check (has_section_access(household_id, 'expenses'));

drop policy if exists homework_all on homework;
create policy homework_all on homework for all
  using (has_section_access(household_id, 'homework'))
  with check (has_section_access(household_id, 'homework'));

drop policy if exists journal_all on journal_entries;
create policy journal_all on journal_entries for all
  using (has_section_access(household_id, 'journal'))
  with check (has_section_access(household_id, 'journal'));

drop policy if exists messages_all on messages;
create policy messages_all on messages for all
  using (has_section_access(household_id, 'messages'))
  with check (has_section_access(household_id, 'messages'));
