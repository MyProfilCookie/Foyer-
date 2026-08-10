-- Uniformise les noms existants et futurs.
update public.parents set name = initcap(lower(trim(regexp_replace(name, '\s+', ' ', 'g'))));
update public.children set name = initcap(lower(trim(regexp_replace(name, '\s+', ' ', 'g'))));

create or replace function public.normalize_person_name()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name := initcap(lower(trim(regexp_replace(new.name, '\s+', ' ', 'g'))));
  return new;
end;
$$;

drop trigger if exists normalize_parent_name_trigger on public.parents;
create trigger normalize_parent_name_trigger
before insert or update of name on public.parents
for each row execute function public.normalize_person_name();

drop trigger if exists normalize_child_name_trigger on public.children;
create trigger normalize_child_name_trigger
before insert or update of name on public.children
for each row execute function public.normalize_person_name();
