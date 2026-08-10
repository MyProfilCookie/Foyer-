'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { DEFAULT_EVENT_COLOR } from './eventColors';
import { PALETTE, inputStyle, labelStyle } from '../_shared/theme';

type Props = {
  householdId: string;
  parentId: string;
  children: { id: string; name: string }[];
  defaultDate?: string;
  existingTypes: string[];
};

export default function EventForm({ householdId, parentId, children, defaultDate, existingTypes }: Props) {
  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate ?? '');
  const [type, setType] = useState('');
  const [color, setColor] = useState(DEFAULT_EVENT_COLOR);
  const [childId, setChildId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!date || date < todayString) {
      setError("La date du rendez-vous ne peut pas être antérieure à aujourd’hui.");
      return;
    }
    setLoading(true);

    const { error: insertError } = await supabase.from('events').insert({
      household_id: householdId,
      parent_id: parentId,
      child_id: childId || null,
      title: title.trim(),
      event_date: date,
      event_type: type.trim(),
      color,
    });

    setLoading(false);
    if (insertError) {
      setError(
        insertError.message.includes('event_date_cannot_be_in_the_past')
          ? "La date du rendez-vous ne peut pas être antérieure à aujourd’hui."
          : "Impossible d'ajouter l'événement."
      );
      return;
    }

    setTitle('');
    setDate(defaultDate ?? '');
    setType('');
    setColor(DEFAULT_EVENT_COLOR);
    setChildId('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="title" style={labelStyle}>Titre</label>
        <input
          id="title"
          style={inputStyle}
          placeholder="Rendez-vous pédiatre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="date" style={labelStyle}>Date</label>
        <input
          id="date"
          type="date"
          min={todayString}
          style={inputStyle}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="type" style={labelStyle}>Type</label>
        <input
          id="type"
          list="event-types"
          style={inputStyle}
          placeholder="Rendez-vous, Garde, École, Anniversaire…"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />
        <datalist id="event-types">
          {existingTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="color" style={labelStyle}>Couleur</label>
        <input
          id="color"
          type="color"
          style={{ border: 'none', background: '#F5F1E8', borderRadius: 12, padding: 3, width: 52, height: 34, cursor: 'pointer' }}
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>

      {children.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label htmlFor="child" style={labelStyle}>Enfant concerné</label>
          <select id="child" style={inputStyle} value={childId} onChange={(e) => setChildId(e.target.value)}>
            <option value="">Aucun en particulier</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          border: 'none',
          background: PALETTE.coral,
          color: '#fff',
          borderRadius: 12,
          padding: '11px 16px',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          fontSize: 14,
          cursor: loading ? 'default' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Ajout…' : 'Ajouter l’événement'}
      </button>
    </form>
  );
}
