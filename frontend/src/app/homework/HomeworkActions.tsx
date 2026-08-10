'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE, ghostButtonStyle } from '../_shared/theme';

export default function HomeworkActions({ homeworkId, status, canDelete }: { homeworkId: string; status: string; canDelete: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);
    await supabase
      .from('homework')
      .update({ status: status === 'done' ? 'pending' : 'done' })
      .eq('id', homeworkId);
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    setLoading(true);
    await supabase.from('homework').delete().eq('id', homeworkId);
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
      <button type="button" style={ghostButtonStyle(PALETTE.goldText)} onClick={toggleStatus} disabled={loading}>
        {status === 'done' ? 'Marquer à faire' : 'Marquer fait'}
      </button>
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
    </div>
  );
}
