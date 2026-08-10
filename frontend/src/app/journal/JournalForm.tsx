'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Props = {
  householdId: string;
  authorId: string;
  children: { id: string; name: string }[];
};

export default function JournalForm({ householdId, authorId, children }: Props) {
  const router = useRouter();
  const [childId, setChildId] = useState(children[0]?.id ?? '');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('journal_entries').insert({
      household_id: householdId,
      author_id: authorId,
      child_id: childId || null,
      entry_date: new Date().toISOString().slice(0, 10),
      text: text.trim(),
    });

    setLoading(false);
    if (insertError) {
      setError("Impossible d'ajouter l'observation.");
      return;
    }

    setText('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {children.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="child" style={labelStyle}>Enfant</label>
          <select id="child" style={inputStyle} value={childId} onChange={(e) => setChildId(e.target.value)}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="text" style={labelStyle}>Observation</label>
        <textarea
          id="text"
          style={inputStyle}
          rows={4}
          placeholder="Léa a bien participé à son cours de natation…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Ajout…' : 'Publier'}
      </button>
    </form>
  );
}
