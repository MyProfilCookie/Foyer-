'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

export default function HouseholdForm({ householdId, initialName, parents }: { householdId: string; initialName: string; parents: { id: string; name: string; email: string }[] }) {
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

    const { error: updateError } = await supabase.from('households').update({ name: name.trim() }).eq('id', householdId);

    setLoading(false);
    if (updateError) {
      setError("Impossible de mettre à jour le foyer.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="householdName" style={labelStyle}>Nom du foyer</label>
          <input
            id="householdName"
            style={inputStyle}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            required
          />
        </div>

        {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}
        {saved && <p style={{ fontSize: 13, color: '#2d8b84', margin: 0 }}>Foyer mis à jour.</p>}

        <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        <div style={labelStyle}>Comptes du foyer</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {parents.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
              <span>{p.name}</span>
              <span style={{ color: PALETTE.muted }}>{p.email}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
