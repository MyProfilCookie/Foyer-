-- Photos de profil privees : chaque personne gere uniquement sa propre photo.
alter table public.parents add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists avatars_select_household on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

create policy avatars_select_household
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and exists (
    select 1 from public.parents pictured
    where pictured.id = split_part(name, '/', 1)::uuid
      and public.is_household_member(pictured.household_id)
  )
);

create policy avatars_insert_own
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and public.is_own_parent(split_part(name, '/', 1)::uuid)
);

create policy avatars_update_own
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and public.is_own_parent(split_part(name, '/', 1)::uuid)
)
with check (
  bucket_id = 'avatars'
  and public.is_own_parent(split_part(name, '/', 1)::uuid)
);

create policy avatars_delete_own
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and public.is_own_parent(split_part(name, '/', 1)::uuid)
);
