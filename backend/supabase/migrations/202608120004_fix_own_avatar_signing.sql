-- Autorise explicitement la creation du lien signe de sa propre photo.
-- Cette verification est identique a celle deja utilisee pour l'envoi du fichier.
drop policy if exists avatars_select_household on storage.objects;

create policy avatars_select_household
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  and (
    public.is_own_parent(split_part(name, '/', 1)::uuid)
    or public.can_view_parent_avatar(split_part(name, '/', 1)::uuid)
  )
);
