'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Props = {
  householdId: string;
  children: { id: string; name: string }[];
};

export default function HomeworkForm({ householdId, children }: Props) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [due, setDue] = useState('');
  const [childId, setChildId] = useState(children[0]?.id ?? '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('homework').insert({
      household_id: householdId,
      child_id: childId || null,
      subject: subject.trim(),
      due_date: due,
      status: 'pending',
    });

    setLoading(false);
    if (insertError) {
      setError("Impossible d'ajouter le devoir.");
      return;
    }

    setSubject('');
    setDue('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="subject" style={labelStyle}>Matière</label>
        <input
          id="subject"
          style={inputStyle}
          placeholder="Mathématiques"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="due" style={labelStyle}>À rendre le</label>
        <input
          id="due"
          type="date"
          style={inputStyle}
          value={due}
          onChange={(e) => setDue(e.target.value)}
          required
        />
      </div>

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

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Ajout…' : 'Ajouter le devoir'}
      </button>
    </form>
  );
}
