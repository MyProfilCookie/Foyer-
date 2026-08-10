'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { inputStyle, labelStyle, primaryButtonStyle } from '../_shared/theme';

type Props = {
  householdId: string;
  authorId: string;
};

export default function MessageForm({ householdId, authorId }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: insertError } = await supabase.from('messages').insert({
      household_id: householdId,
      author_id: authorId,
      text: text.trim(),
    });

    setLoading(false);
    if (insertError) {
      setError("Impossible d'envoyer le message.");
      return;
    }

    setText('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label htmlFor="text" style={labelStyle}>Message</label>
        <textarea
          id="text"
          style={inputStyle}
          rows={4}
          placeholder="Écrire un message à l'autre parent…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>

      {error && <p style={{ fontSize: 13, color: '#c0392b', margin: 0 }}>{error}</p>}

      <button type="submit" style={primaryButtonStyle(loading)} disabled={loading}>
        {loading ? 'Envoi…' : 'Envoyer'}
      </button>
    </form>
  );
}
