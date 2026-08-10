'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError('Email ou mot de passe incorrect.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 26, color: PALETTE.coral, textDecoration: 'none' }}>
          Foyer+
        </Link>
        <p style={{ fontSize: 13, color: PALETTE.muted, marginTop: 4 }}>Connexion à votre espace</p>
      </div>

      <div style={{ width: 'min(400px, 100%)', background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 28 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 20, marginBottom: 4 }}>👋 Se connecter</div>
        <p style={{ fontSize: 13, color: PALETTE.muted, margin: '0 0 22px' }}>Accédez à votre espace parental partagé.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="email" style={labelStyle}>Adresse email</label>
            <input
              id="email"
              type="email"
              style={inputStyle}
              placeholder="camille@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor="password" style={labelStyle}>Mot de passe</label>
            <input
              id="password"
              type="password"
              style={inputStyle}
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

          <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 13, color: PALETTE.muted, marginTop: 20 }}>
        Pas encore de compte ?{' '}
        <Link href="/signup" style={{ color: PALETTE.coral, fontWeight: 700, textDecoration: 'none' }}>
          Créer un espace
        </Link>
      </p>
    </div>
  );
}
