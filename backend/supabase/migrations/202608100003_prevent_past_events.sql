-- Les anciens rendez-vous restent conserves, mais aucun nouveau rendez-vous
-- ne peut etre cree ou deplace avant la date du jour.
create or replace function public.prevent_past_event_date()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.event_date < current_date then
    raise exception 'event_date_cannot_be_in_the_past';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_past_event_date_trigger on public.events;
create trigger prevent_past_event_date_trigger
before insert or update of event_date on public.events
for each row
execute function public.prevent_past_event_date();
