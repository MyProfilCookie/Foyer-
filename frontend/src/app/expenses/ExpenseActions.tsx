'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, ghostButtonStyle } from '../_shared/theme';

export default function ExpenseActions({ expenseId, status, canDelete }: { expenseId: string; status: string; canDelete: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function markAsPaid() {
    const confirmed = window.confirm(
      'Confirmer le remboursement ?\n\nCette action est définitive : la dépense ne pourra plus être remise en attente.'
    );
    if (!confirmed) return;

    setError('');
    setLoading(true);
    const { error: updateError } = await supabase
      .from('expenses')
      .update({ status: 'paid' })
      .eq('id', expenseId)
      .eq('status', 'pending');
    setLoading(false);
    if (updateError) {
      setError("Impossible de confirmer le remboursement.");
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    await supabase.from('expenses').delete().eq('id', expenseId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, flex: 'none', flexWrap: 'wrap' }}>
      {status === 'pending' ? (
        <button type="button" style={ghostButtonStyle(PALETTE.tealText)} onClick={markAsPaid} disabled={loading}>
          {loading ? 'Confirmation…' : 'Marquer remboursée'}
        </button>
      ) : (
        <span style={{ background: PALETTE.tealBg, color: PALETTE.tealText, borderRadius: 9, padding: '5px 9px', fontSize: 11, fontWeight: 700 }}>
          ✓ Remboursée
        </span>
      )}
      {canDelete && <button
        type="button"
        aria-label="Supprimer"
        onClick={handleDelete}
        disabled={loading}
        style={{ border: 'none', background: 'transparent', color: '#c7c2b8', cursor: loading ? 'default' : 'pointer', padding: 4, display: 'flex' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18" />
          <path d="M6 6l12 12" />
        </svg>
      </button>}
      {error && <span role="alert" style={{ width: '100%', color: '#b5473c', fontSize: 11, textAlign: 'right' }}>{error}</span>}
    </div>
  );
}
