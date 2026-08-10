'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, formatPersonName, inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Child = { id: string; name: string; birth_date: string | null };

export default function ChildrenManager({ householdId, children }: { householdId: string; children: Child[] }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [birth, setBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('children').insert({
      household_id: householdId,
      name: formatPersonName(name),
      birth_date: birth || null,
    });

    setLoading(false);
    if (insertError) {
      setError("Impossible d'ajouter l'enfant.");
      return;
    }
    setName('');
    setBirth('');
    router.refresh();
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    await supabase.from('children').delete().eq('id', id);
    setRemovingId(null);
    router.refresh();
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {children.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight, margin: 0 }}>Aucun enfant enregistré.</p>}
        {children.map((c) => (
          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
            <span>
              {c.name}
              {c.birth_date && <span style={{ color: PALETTE.muted }}> · né(e) le {c.birth_date}</span>}
            </span>
            <button
              type="button"
              aria-label="Retirer"
              onClick={() => handleRemove(c.id)}
              disabled={removingId === c.id}
              style={{ border: 'none', background: 'transparent', color: '#c7c2b8', cursor: 'pointer', padding: 4, display: 'flex' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 10, alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="childName" style={labelStyle}>Prénom</label>
          <input id="childName" style={inputStyle} placeholder="Léa" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setName(formatPersonName(name))} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="childBirth" style={labelStyle}>Naissance</label>
          <input id="childBirth" type="date" style={inputStyle} value={birth} onChange={(e) => setBirth(e.target.value)} />
        </div>
        <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
          {loading ? '…' : 'Ajouter'}
        </button>
      </form>

      {error && <p style={{ fontSize: 13, color: '#c0392b', marginTop: 10 }}>{error}</p>}
    </>
  );
}
