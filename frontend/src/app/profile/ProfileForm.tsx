'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { formatPersonName, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

export default function ProfileForm({ parentId, initialName, email }: { parentId: string; initialName: string; email: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);

    const normalizedName = formatPersonName(name);
    const { error: updateError } = await supabase.from('parents').update({ name: normalizedName }).eq('id', parentId);

    setLoading(false);
    if (updateError) {
      setError('Impossible de mettre à jour votre profil.');
      return;
    }
    setSaved(true);
    setName(normalizedName);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="name" style={labelStyle}>Nom complet</label>
        <input
          id="name"
          style={inputStyle}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
          onBlur={() => setName(formatPersonName(name))}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={labelStyle}>Adresse email</label>
        <div style={{ ...inputStyle, color: '#8a8a8a' }}>{email}</div>
      </div>

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}
      {saved && <p style={{ fontSize: 13, color: '#2d8b84', margin: 0 }}>Profil mis à jour.</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}
