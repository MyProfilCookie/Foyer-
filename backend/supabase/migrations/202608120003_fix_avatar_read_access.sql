-- Corrige la lecture des photos privees dans Storage.
-- La fonction SECURITY DEFINER verifie le foyer sans etre bloquee par la RLS de parents.
create or replace function public.can_view_parent_avatar(target_parent uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.parents pictured
    join public.parents viewer
      on viewer.household_id = pictured.household_id
    where pictured.id = target_parent
      and lower(trim(viewer.email)) = public.current_user_email()
  );
$$;

revoke all on function public.can_view_parent_avatar(uuid) from public;
grant execute on function public.can_view_parent_avatar(uuid) to authenticated;

drop policy if exists avatars_select_household on storage.objects;

create policy avatars_select_household
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and public.can_view_parent_avatar(split_part(name, '/', 1)::uuid)
);
