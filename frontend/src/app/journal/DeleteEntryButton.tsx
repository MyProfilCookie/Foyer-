'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await supabase.from('journal_entries').delete().eq('id', entryId);
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label="Supprimer"
      onClick={handleDelete}
      disabled={loading}
      style={{ border: 'none', background: 'transparent', color: '#c7c2b8', cursor: loading ? 'default' : 'pointer', padding: 4, display: 'flex', flex: 'none' }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" />
        <path d="M6 6l12 12" />
      </svg>
    </button>
  );
}
