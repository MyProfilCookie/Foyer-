'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE } from '../_shared/theme';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        border: `1px solid ${PALETTE.coral}`,
        background: 'transparent',
        color: PALETTE.coral,
        borderRadius: 12,
        padding: '11px 16px',
        fontFamily: 'var(--font-heading)',
        fontWeight: 700,
        fontSize: 14,
        cursor: loading ? 'default' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Déconnexion…' : '🚪 Se déconnecter'}
    </button>
  );
}
