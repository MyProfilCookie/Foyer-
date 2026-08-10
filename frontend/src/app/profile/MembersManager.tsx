'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, SECTIONS, SECTION_LABELS, formatPersonName, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Member = { id: string; name: string; email: string; role: 'owner' | 'admin' | 'member'; permissions: string[] };

function sectionToggleStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: '5px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    border: active ? 'none' : `1px solid ${PALETTE.divider}`,
    background: active ? PALETTE.coralBg : 'transparent',
    color: active ? PALETTE.coralText : PALETTE.muted,
  };
}

const MAX_MEMBERS = 3; // + 1 owner = 4 people per household

export default function MembersManager({ householdId, members }: { householdId: string; members: Member[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [inviteCooldown, setInviteCooldown] = useState(false);
  const seatLimitReached = members.length >= MAX_MEMBERS;

  function startInviteCooldown() {
    setInviteCooldown(true);
    window.setTimeout(() => setInviteCooldown(false), 60_000);
  }

  function toggleNew(section: string) {
    setSelected((s) => (s.includes(section) ? s.filter((x) => x !== section) : [...s, section]));
  }

  async function togglePermission(member: Member, section: string) {
    setBusyId(member.id);
    const next = member.permissions.includes(section)
      ? member.permissions.filter((x) => x !== section)
      : [...member.permissions, section];
    await supabase.from('parents').update({ permissions: next }).eq('id', member.id);
    setBusyId(null);
    router.refresh();
  }

  async function changeRole(member: Member, nextRole: 'member' | 'admin') {
    if (member.role === nextRole) return;
    const confirmed = window.confirm(
      nextRole === 'admin'
        ? `Donner les droits administrateur à ${member.name} ? Cette personne pourra gérer le foyer et les autres membres.`
        : `Retirer les droits administrateur de ${member.name} ? Vous pourrez ensuite choisir ses accès.`
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');
    setBusyId(member.id);
    const update = nextRole === 'admin'
      ? { role: nextRole, permissions: SECTIONS.slice() }
      : { role: nextRole };
    const { error: updateError } = await supabase.from('parents').update(update).eq('id', member.id);
    setBusyId(null);

    if (updateError) {
      setError("Le rôle de cette personne n'a pas pu être modifié.");
      return;
    }

    setSuccess(`${member.name} est maintenant ${nextRole === 'admin' ? 'administrateur' : 'membre'}.`);
    router.refresh();
  }

  async function removeMember(memberId: string) {
    setBusyId(memberId);
    await supabase.from('parents').delete().eq('id', memberId);
    setBusyId(null);
    router.refresh();
  }

  async function resendMemberInvite(member: Member) {
    if (inviteCooldown) return;
    setError('');
    setSuccess('');
    setBusyId(member.id);
    startInviteCooldown();
    const invitedEmail = member.email.trim().toLowerCase();
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: invitedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/invite?email=${encodeURIComponent(invitedEmail)}`,
      },
    });
    setBusyId(null);
    if (resendError) {
      setError(
        resendError.status === 429
          ? 'Trop de liens ont été demandés. Attendez au moins une minute avant de réessayer.'
          : "Impossible de renvoyer l’invitation pour le moment."
      );
      return;
    }
    setSuccess(`Nouvelle invitation envoyée à ${invitedEmail}.`);
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (seatLimitReached) {
      setError('Le foyer a atteint sa limite de 4 personnes.');
      return;
    }
    if (role === 'member' && selected.length === 0) {
      setError('Choisissez au moins une section.');
      return;
    }
    if (inviteCooldown) {
      setError('Veuillez patienter une minute avant d’envoyer une nouvelle invitation.');
      return;
    }
    setLoading(true);

    const invitedEmail = email.trim().toLowerCase();
    const { data: invitedParent, error: insertError } = await supabase
      .from('parents')
      .insert({
        household_id: householdId,
        name: formatPersonName(name),
        email: invitedEmail,
        role,
        permissions: role === 'admin' ? SECTIONS.slice() : selected,
      })
      .select('id')
      .single();

    if (insertError) {
      setLoading(false);
      const message = insertError.message.toLowerCase();
      let friendlyMessage = "Impossible d'ajouter ce membre.";
      if (message.includes('duplicate')) friendlyMessage = 'Cet email est déjà utilisé.';
      else if (message.includes('household_seat_limit_reached')) friendlyMessage = 'Le foyer a atteint sa limite de 4 personnes.';
      setError(friendlyMessage);
      return;
    }

    const { error: emailError } = await supabase.auth.signInWithOtp({
      email: invitedEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/invite?email=${encodeURIComponent(invitedEmail)}`,
      },
    });
    startInviteCooldown();

    if (emailError) {
      if (invitedParent?.id) {
        await supabase.from('parents').delete().eq('id', invitedParent.id);
      }
      setLoading(false);
      setError(
        emailError.status === 429
          ? 'La limite d’envoi Supabase est atteinte. Attendez quelques minutes, puis réessayez.'
          : "L’e-mail d’invitation n’a pas pu être envoyé. Aucun membre n’a été ajouté."
      );
      return;
    }

    setLoading(false);
    setSuccess(`Invitation envoyée à ${invitedEmail}.`);
    setName('');
    setEmail('');
    setSelected([]);
    setRole('member');
    router.refresh();
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 20 }}>
        {members.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight, margin: 0 }}>Aucun membre invité.</p>}
        {members.map((m) => (
          <div key={m.id} style={{ padding: '10px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: PALETTE.muted }}>{m.email}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  aria-label={`Rôle de ${m.name}`}
                  value={m.role}
                  disabled={busyId === m.id}
                  onChange={(event) => changeRole(m, event.target.value as 'member' | 'admin')}
                  style={{ ...inputStyle, width: 'auto', minWidth: 118, padding: '6px 9px', fontSize: 11, fontWeight: 700 }}
                >
                  <option value="member">Membre</option>
                  <option value="admin">Administrateur</option>
                </select>
                <button type="button" onClick={() => resendMemberInvite(m)} disabled={busyId === m.id || inviteCooldown} style={{ border: 'none', background: PALETTE.tealBg, color: PALETTE.tealText, borderRadius: 8, padding: '5px 8px', fontSize: 10, fontWeight: 700, cursor: inviteCooldown ? 'default' : 'pointer', opacity: inviteCooldown ? .6 : 1 }}>
                  {inviteCooldown ? 'Veuillez patienter' : 'Renvoyer l’invitation'}
                </button>
                <button
                  type="button"
                  aria-label="Retirer"
                  onClick={() => removeMember(m.id)}
                  disabled={busyId === m.id}
                  style={{ border: 'none', background: 'transparent', color: '#c7c2b8', cursor: 'pointer', padding: 4, display: 'flex', flex: 'none' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {m.role === 'member' && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => togglePermission(m, s)}
                  style={sectionToggleStyle(m.permissions.includes(s))}
                >
                  {SECTION_LABELS[s]}
                </button>
              ))}
            </div>}
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Inviter un membre</div>
      {seatLimitReached ? (
        <p style={{ fontSize: 13, color: PALETTE.mutedLight, margin: 0 }}>
          Le foyer a atteint sa limite de 4 personnes. Retirez un membre pour en inviter un autre.
        </p>
      ) : (
      <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="memberName" style={labelStyle}>Nom</label>
          <input id="memberName" style={inputStyle} placeholder="Mamie Josette" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(formatPersonName(name))} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="memberEmail" style={labelStyle}>Email</label>
          <input
            id="memberEmail"
            type="email"
            style={inputStyle}
            placeholder="josette@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="memberRole" style={labelStyle}>Rôle</label>
          <select id="memberRole" style={inputStyle} value={role} onChange={(e) => setRole(e.target.value as 'member' | 'admin')}>
            <option value="member">Membre — accès sélectionnés</option>
            <option value="admin">Administrateur — accès complet et gestion du foyer</option>
          </select>
        </div>
        {role === 'member' && <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>Sections accessibles</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SECTIONS.map((s) => (
              <button key={s} type="button" onClick={() => toggleNew(s)} style={sectionToggleStyle(selected.includes(s))}>
                {SECTION_LABELS[s]}
              </button>
            ))}
          </div>
        </div>}

        {error && <p role="alert" style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}
        {success && <p role="status" style={{ fontSize: 13, color: PALETTE.tealText, margin: 0 }}>{success}</p>}

        <button type="submit" style={primaryButtonStyle(loading || inviteCooldown)} disabled={loading || inviteCooldown}>
          {loading ? 'Envoi…' : inviteCooldown ? 'Veuillez patienter…' : 'Envoyer l’invitation'}
        </button>
      </form>
      )}
      <p style={{ fontSize: 12, color: PALETTE.mutedLight, marginTop: 10 }}>
        La personne recevra un lien sécurisé par e-mail. En l’ouvrant, elle sera connectée et accédera directement
        aux sections que vous avez choisies.
      </p>
    </>
  );
}
