'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, SECTION_LABELS, formatPersonName, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Invitation = {
  parentId: string;
  name: string;
  email: string;
  householdName: string;
  permissions: string[];
};

export default function InvitePage() {
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [resent, setResent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams(window.location.search);
    const emailFromLink = params.get('email') ?? '';
    const linkError = params.get('error_code');
    setInviteEmail(emailFromLink);

    async function loadInvitation() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user?.email) {
        setError(
          linkError === 'otp_expired'
            ? 'Ce lien a expiré ou a déjà été utilisé. Vous pouvez demander un nouveau lien ci-dessous.'
            : 'Ce lien d’invitation est invalide. Demandez une nouvelle invitation.'
        );
        setLoading(false);
        return;
      }

      if (emailFromLink && user.email.toLowerCase() !== emailFromLink.toLowerCase()) {
        setError(
          `Cette invitation est destinée à ${emailFromLink}, mais ce navigateur est connecté avec une autre adresse. Déconnectez le compte actuel ou ouvrez le dernier lien dans une fenêtre privée.`
        );
        setLoading(false);
        return;
      }

      const { data: parent, error: parentError } = await supabase
        .from('parents')
        .select('id, name, email, household_id, permissions')
        .ilike('email', user.email)
        .maybeSingle();

      if (!active) return;
      if (parentError || !parent) {
        setError('Aucune invitation ne correspond à cette adresse e-mail.');
        setLoading(false);
        return;
      }

      const { data: household } = await supabase
        .from('households')
        .select('name')
        .eq('id', parent.household_id)
        .maybeSingle();

      if (!active) return;
      const info = {
        parentId: parent.id,
        name: parent.name,
        email: parent.email,
        householdName: household?.name ?? 'Foyer partagé',
        permissions: parent.permissions ?? [],
      };
      setInvitation(info);
      setName(info.name);
      setLoading(false);
    }

    if (linkError) {
      setError(
        linkError === 'otp_expired'
          ? 'Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien et utilisez uniquement le dernier e-mail reçu.'
          : 'Supabase a refusé ce lien d’invitation. Demandez une nouvelle invitation.'
      );
      setLoading(false);
      return () => { active = false; };
    }

    if (!emailFromLink) {
      setError('Cette ancienne invitation ne peut plus être utilisée. Demandez un nouveau lien depuis le profil administrateur.');
      setLoading(false);
      return () => { active = false; };
    }

    loadInvitation();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadInvitation();
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function resendInvitation() {
    if (!inviteEmail || resendCooldown) return;
    setResending(true);
    setResendCooldown(true);
    window.setTimeout(() => setResendCooldown(false), 60_000);
    setResent(false);
    setError('');
    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: inviteEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/invite?email=${encodeURIComponent(inviteEmail)}`,
      },
    });
    setResending(false);
    if (resendError) {
      setError(
        resendError.status === 429
          ? 'La limite d’envoi est atteinte. Attendez au moins une minute ; si le blocage continue, réessayez plus tard.'
          : 'Le nouveau lien n’a pas pu être envoyé. Attendez quelques instants puis réessayez.'
      );
      return;
    }
    setResent(true);
  }

  async function handleActivate(e: FormEvent) {
    e.preventDefault();
    if (!invitation) return;
    setError('');
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSaving(true);
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
      data: { name: formatPersonName(name) },
    });
    if (passwordError) {
      setSaving(false);
      setError('Impossible de définir le mot de passe. Le lien a peut-être expiré.');
      return;
    }

    const { error: profileError } = await supabase
      .from('parents')
      .update({ name: formatPersonName(name) })
      .eq('id', invitation.parentId);
    setSaving(false);
    if (profileError) {
      setError('Le compte est activé, mais le nom n’a pas pu être enregistré.');
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <main style={{ minHeight: '100vh', background: PALETTE.bgGradient, display: 'grid', placeItems: 'center', padding: 20, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <section style={{ width: 'min(520px, 100%)', background: 'rgba(255,255,255,.9)', borderRadius: 26, padding: '30px clamp(22px, 5vw, 38px)', boxShadow: PALETTE.cardShadow }}>
        <div style={{ fontFamily: 'var(--font-heading)', color: PALETTE.coral, fontWeight: 800, fontSize: 20, marginBottom: 24 }}>Foyer+</div>

        {loading ? (
          <p style={{ color: PALETTE.muted }}>Ouverture de votre invitation…</p>
        ) : invitation ? (
          <>
            <div style={{ display: 'inline-flex', background: PALETTE.tealBg, color: PALETTE.tealText, borderRadius: 999, padding: '6px 11px', fontSize: 11, fontWeight: 700, marginBottom: 14 }}>INVITATION REÇUE</div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 30, lineHeight: 1.05, marginBottom: 8 }}>Bienvenue dans<br />{invitation.householdName}</h1>
            <p style={{ color: PALETTE.muted, fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>Confirmez vos informations pour activer votre espace personnel.</p>

            <div style={{ background: '#f4f8fb', borderRadius: 16, padding: 14, marginBottom: 20 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Vos accès</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {invitation.permissions.map((section) => (
                  <span key={section} style={{ background: '#fff', color: '#577087', padding: '5px 9px', borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                    {SECTION_LABELS[section] ?? section}
                  </span>
                ))}
              </div>
            </div>

            <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div><label htmlFor="invite-name" style={labelStyle}>Votre nom</label><input id="invite-name" style={{ ...inputStyle, marginTop: 6 }} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(formatPersonName(name))} required /></div>
              <div><label htmlFor="invite-email" style={labelStyle}>Adresse e-mail</label><input id="invite-email" style={{ ...inputStyle, marginTop: 6, opacity: .7 }} value={invitation.email} disabled /></div>
              <div><label htmlFor="invite-password" style={labelStyle}>Créer un mot de passe</label><input id="invite-password" type="password" style={{ ...inputStyle, marginTop: 6 }} value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required /></div>
              <div><label htmlFor="invite-confirm" style={labelStyle}>Confirmer le mot de passe</label><input id="invite-confirm" type="password" style={{ ...inputStyle, marginTop: 6 }} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required /></div>
              {error && <p role="alert" style={{ color: '#b5473c', fontSize: 13 }}>{error}</p>}
              <button type="submit" disabled={saving} style={primaryButtonStyle(saving)}>{saving ? 'Activation…' : 'Activer mon espace'}</button>
            </form>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, marginBottom: 10 }}>Invitation indisponible</h1>
            {error && <p role="alert" style={{ color: '#b5473c', fontSize: 14, lineHeight: 1.5, marginBottom: 18 }}>{error}</p>}
            {inviteEmail && (
              <>
                <p style={{ color: PALETTE.muted, fontSize: 13, marginBottom: 12 }}>Un nouveau lien sera envoyé à <strong>{inviteEmail}</strong>.</p>
                <button type="button" onClick={resendInvitation} disabled={resending || resendCooldown} style={primaryButtonStyle(resending || resendCooldown)}>
                  {resending ? 'Envoi…' : resendCooldown ? 'Veuillez patienter…' : 'Renvoyer un lien'}
                </button>
                {resent && <p role="status" style={{ color: PALETTE.tealText, fontSize: 13, marginTop: 12 }}>Nouveau lien envoyé. Utilisez uniquement le dernier e-mail reçu.</p>}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
