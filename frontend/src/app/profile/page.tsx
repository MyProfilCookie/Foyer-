import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE } from '../_shared/theme';
import ProfileForm from './ProfileForm';
import PasswordForm from './PasswordForm';
import HouseholdForm from './HouseholdForm';
import ChildrenManager from './ChildrenManager';
import MembersManager from './MembersManager';
import LogoutButton from './LogoutButton';
import PageHeading from '../_shared/PageHeading';

export default async function ProfilePage() {
  const { supabase, user, ownParent, householdId, isAdmin, parents, children } = await requireHousehold();
  const invitedMembers = parents.filter((p) => p.role !== 'owner');

  let householdName = '';
  if (householdId) {
    const { data } = await supabase.from('households').select('name').eq('id', householdId).maybeSingle();
    householdName = data?.name ?? '';
  }

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/profile" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <PageHeading title="Profil" subtitle="Votre compte et votre foyer partagé" />
          <LogoutButton />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Mon compte</div>
            {ownParent ? (
              <ProfileForm parentId={ownParent.id} initialName={ownParent.name} email={user.email ?? ''} />
            ) : (
              <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun profil parent relié à ce compte.</p>
            )}
          </div>

          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Mot de passe</div>
            <PasswordForm />
          </div>

          {householdId && isAdmin && (
            <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Foyer</div>
              <HouseholdForm householdId={householdId} initialName={householdName} parents={parents} />
            </div>
          )}

          {householdId && isAdmin && (
            <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Enfants</div>
              <ChildrenManager householdId={householdId} children={children} />
            </div>
          )}

          {householdId && isAdmin && (
            <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Membres invités</div>
              <p style={{ fontSize: 12, color: PALETTE.mutedLight, margin: '0 0 14px' }}>
                Invitez un membre avec des accès limités ou nommez un autre administrateur du foyer.
              </p>
              <MembersManager householdId={householdId} members={invitedMembers} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
