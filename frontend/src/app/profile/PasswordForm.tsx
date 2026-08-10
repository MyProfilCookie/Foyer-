'use client';

import { useState, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase/client';
import { inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

export default function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (password.length < 6) {
      setError('8 caractères minimum recommandés (6 minimum).');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError('Impossible de mettre à jour le mot de passe.');
      return;
    }
    setPassword('');
    setConfirm('');
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="password" style={labelStyle}>Nouveau mot de passe</label>
        <input
          id="password"
          type="password"
          style={inputStyle}
          placeholder="8 caractères minimum"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="confirm" style={labelStyle}>Confirmer</label>
        <input
          id="confirm"
          type="password"
          style={inputStyle}
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setSaved(false);
          }}
        />
      </div>

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}
      {saved && <p style={{ fontSize: 13, color: '#2d8b84', margin: 0 }}>Mot de passe mis à jour.</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Mise à jour…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}
