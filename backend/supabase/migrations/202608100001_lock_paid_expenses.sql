-- Un remboursement confirmé est définitif.
-- Cette protection s'applique même si une mise à jour contourne l'interface.
create or replace function prevent_paid_expense_status_change()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'paid' and new.status is distinct from 'paid' then
    raise exception 'Une dépense remboursée ne peut plus être remise en attente.';
  end if;
  return new;
end;
$$;

drop trigger if exists lock_paid_expense_status on expenses;

create trigger lock_paid_expense_status
before update of status on expenses
for each row
execute function prevent_paid_expense_status_change();
