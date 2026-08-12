'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, formatPersonName, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type ChildRow = { id: string; name: string; birth: string };

const STEP_LABELS = ['1. Compte', '2. Autre parent', '3. Enfants', '4. Confirmation'];

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState({ name: '', email: '', password: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [children, setChildren] = useState<ChildRow[]>([{ id: 'c1', name: '', birth: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [joinedExisting, setJoinedExisting] = useState(false);

  const canNext1 = account.name.trim().length > 0 && account.email.includes('@') && account.password.length >= 6;
  const canNext3 = children.some((c) => c.name.trim().length > 0);

  function updateChild(id: string, field: 'name' | 'birth', value: string) {
    setChildren((rows) => rows.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addChild() {
    setChildren((rows) => [...rows, { id: `c${Date.now()}`, name: '', birth: '' }]);
  }

  function removeChild(id: string) {
    setChildren((rows) => rows.filter((c) => c.id !== id));
  }

  async function handleJoinExisting() {
    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: account.email.trim(),
      password: account.password,
      options: { data: { name: formatPersonName(account.name) } },
    });

    setLoading(false);
    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already registered')
          ? 'Un compte existe déjà avec cet email.'
          : "Impossible de créer le compte."
      );
      return;
    }

    setJoinedExisting(true);
    setStep(4);
  }

  async function handleFinish() {
    setError('');
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: account.email.trim(),
      password: account.password,
      options: { data: { name: formatPersonName(account.name) } },
    });

    if (signUpError) {
      setError(
        signUpError.message.toLowerCase().includes('already registered')
          ? 'Un compte existe déjà avec cet email.'
          : "Impossible de créer le compte."
      );
      setLoading(false);
      return;
    }

    const { data: household, error: householdError } = await supabase
      .from('households')
      .insert({ name: `Foyer de ${formatPersonName(account.name)}` })
      .select()
      .single();

    if (householdError || !household) {
      setError("Le compte a été créé mais l'espace n'a pas pu être initialisé.");
      setLoading(false);
      return;
    }

    const { data: newParent, error: parentError } = await supabase
      .from('parents')
      .insert({ household_id: household.id, name: formatPersonName(account.name), email: account.email.trim().toLowerCase(), role: 'owner' })
      .select()
      .single();

    if (newParent) {
      await supabase.from('households').update({ owner_id: newParent.id }).eq('id', household.id);
    }

    const namedChildren = children.filter((c) => c.name.trim().length > 0);
    if (namedChildren.length > 0) {
      await supabase.from('children').insert(
        namedChildren.map((c) => ({
          household_id: household.id,
          name: formatPersonName(c.name),
          birth_date: c.birth || null,
        }))
      );
    }

    setLoading(false);
    if (parentError) {
      setError("Le compte et l'espace ont été créés, mais votre profil n'a pas pu être enregistré.");
    }
    setStep(4);
  }

  async function handleNext() {
    if (step === 1) {
      if (!canNext1) return;
      setError('');
      setLoading(true);
      const { data: invite } = await supabase.rpc('has_pending_invite', {
        candidate_email: account.email.trim(),
      });
      setLoading(false);
      if (invite === true) {
        await handleJoinExisting();
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!canNext3) return;
      await handleFinish();
    }
  }

  function handleBack() {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  }

  const nextDisabled = loading || (step === 1 && !canNext1) || (step === 3 && !canNext3);
  const nextLabel = loading ? 'Création…' : step === 3 ? 'Terminer' : 'Suivant';
  const namedChildren = children.filter((c) => c.name.trim().length > 0).map((c) => formatPersonName(c.name));

  return (
    <div className="authPage" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: PALETTE.coral, textDecoration: 'none' }}>
          Foyer+
        </Link>
        <p style={{ fontSize: 13, color: PALETTE.muted, marginTop: 4 }}>Créer votre espace partagé</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            style={{
              fontSize: 12,
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: 10,
              color: step >= i + 1 ? PALETTE.coralText : PALETTE.muted,
              background: step >= i + 1 ? PALETTE.coralBg : '#F5F1E8',
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <div style={{ width: 'min(560px, 100%)', background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 28 }}>
        {step === 1 && (
          <>
            <div className="authSectionTitle" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Vos informations</div>
            <p style={{ fontSize: 13, color: PALETTE.muted, margin: '0 0 18px' }}>
              Ce compte vous permet de gérer le calendrier, les dépenses et le suivi des enfants.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="name" style={labelStyle}>Nom complet</label>
                <input
                  id="name"
                  style={inputStyle}
                  placeholder="Camille Dubois"
                  value={account.name}
                  onChange={(e) => setAccount((a) => ({ ...a, name: e.target.value }))}
                  onBlur={() => setAccount((a) => ({ ...a, name: formatPersonName(a.name) }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="email" style={labelStyle}>Adresse email</label>
                <input
                  id="email"
                  type="email"
                  style={inputStyle}
                  placeholder="camille@email.com"
                  value={account.email}
                  onChange={(e) => setAccount((a) => ({ ...a, email: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="password" style={labelStyle}>Mot de passe</label>
                <input
                  id="password"
                  type="password"
                  style={inputStyle}
                  placeholder="8 caractères minimum"
                  value={account.password}
                  onChange={(e) => setAccount((a) => ({ ...a, password: e.target.value }))}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: PALETTE.mutedLight, margin: '14px 0 0' }}>
              Vos informations restent privées ; seul votre espace partagé sera visible par l&apos;autre parent une
              fois invité.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="authSectionTitle" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Inviter l&apos;autre parent</div>
            <p style={{ fontSize: 13, color: PALETTE.muted, margin: '0 0 18px' }}>
              L&apos;autre parent recevra un lien pour rejoindre votre espace et voir le calendrier, les dépenses et
              le journal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label htmlFor="inviteEmail" style={labelStyle}>Email de l&apos;autre parent</label>
              <input
                id="inviteEmail"
                type="email"
                style={inputStyle}
                placeholder="thomas@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <p style={{ fontSize: 12, color: PALETTE.mutedLight, margin: '14px 0 0' }}>
              Vous pouvez aussi passer cette étape et inviter l&apos;autre parent plus tard, depuis l&apos;espace.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <div className="authSectionTitle" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>Enfants concernés</div>
            <p style={{ fontSize: 13, color: PALETTE.muted, margin: '0 0 18px' }}>Ajoutez chaque enfant suivi dans l&apos;espace partagé.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {children.map((row) => (
                <div key={row.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 36px', gap: 10, alignItems: 'end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label htmlFor={`child-name-${row.id}`} style={labelStyle}>Prénom</label>
                    <input
                      id={`child-name-${row.id}`}
                      style={inputStyle}
                      placeholder="Léa"
                      value={row.name}
                      onChange={(e) => updateChild(row.id, 'name', e.target.value)}
                      onBlur={() => updateChild(row.id, 'name', formatPersonName(row.name))}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label htmlFor={`child-birth-${row.id}`} style={labelStyle}>Naissance</label>
                    <input
                      id={`child-birth-${row.id}`}
                      type="date"
                      style={inputStyle}
                      value={row.birth}
                      onChange={(e) => updateChild(row.id, 'birth', e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Retirer"
                    onClick={() => removeChild(row.id)}
                    style={{ border: 'none', background: '#F5F1E8', color: PALETTE.muted, width: 36, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addChild}
              style={{ marginTop: 12, border: 'none', background: 'transparent', color: PALETTE.coral, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}
            >
              + Ajouter un enfant
            </button>
          </>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div
              style={{
                width: 52, height: 52, borderRadius: '50%', background: PALETTE.tealBg, color: PALETTE.tealText,
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 24,
              }}
            >
              ✓
            </div>
            <div className="authSectionTitle" style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, marginBottom: 4 }}>
              {joinedExisting ? 'Votre compte est prêt' : 'Votre espace est prêt'}
            </div>
            <p style={{ fontSize: 13, color: PALETTE.muted }}>
              {joinedExisting
                ? `Bonjour ${account.name.trim()}, votre compte a été activé. Vous avez maintenant accès à l'espace partagé qui vous a été ouvert.`
                : `Bonjour ${account.name.trim()}, votre espace partagé Foyer+ a été créé.`}
            </p>
            {!joinedExisting && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', margin: '18px 0', padding: 14, background: '#F5F1E8', borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                  <span style={{ color: PALETTE.muted }}>Compte</span>
                  <span>{account.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                  <span style={{ color: PALETTE.muted }}>Autre parent</span>
                  <span>{inviteEmail.trim() ? inviteEmail.trim() : 'Aucune invitation envoyée'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 12 }}>
                  <span style={{ color: PALETTE.muted }}>Enfants</span>
                  <span>{namedChildren.length ? namedChildren.join(', ') : 'Aucun enfant ajouté'}</span>
                </div>
              </div>
            )}
            <Link
              href="/login"
              style={{ display: 'block', textAlign: 'center', border: 'none', background: PALETTE.coral, color: '#fff', borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, textDecoration: 'none', marginTop: 18 }}
            >
              Se connecter à l&apos;espace
            </Link>
          </div>
        )}

        {error && <p style={{ fontSize: 13, color: '#c0392b', margin: '12px 0 0' }}>{error}</p>}

        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                style={{ border: `1px solid #eee`, background: 'transparent', color: PALETTE.text, borderRadius: 12, padding: '12px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              >
                Précédent
              </button>
            )}
            <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  style={{ border: 'none', background: 'transparent', color: PALETTE.muted, fontSize: 14, cursor: 'pointer', padding: '12px 8px' }}
                >
                  Passer
                </button>
              )}
              <button type="button" onClick={handleNext} disabled={nextDisabled} style={primaryButtonStyle(nextDisabled)}>
                {nextLabel}
              </button>
            </div>
          </div>
        )}
      </div>

      {step === 1 && (
        <p style={{ fontSize: 13, color: PALETTE.muted, marginTop: 20 }}>
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: PALETTE.coral, fontWeight: 700, textDecoration: 'none' }}>
            Se connecter
          </Link>
        </p>
      )}
    </div>
  );
}
