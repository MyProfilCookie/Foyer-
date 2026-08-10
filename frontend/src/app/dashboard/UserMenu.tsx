'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { PALETTE } from '../_shared/theme';

export default function UserMenu({ name }: { name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu du compte"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: PALETTE.coral,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12,
          border: `2px solid ${PALETTE.bg}`,
          cursor: 'pointer',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            right: 0,
            background: PALETTE.card,
            borderRadius: 14,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            padding: 6,
            minWidth: 170,
            zIndex: 20,
          }}
        >
          <div style={{ padding: '8px 10px', fontSize: 12, color: PALETTE.muted, fontWeight: 600 }}>{name}</div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 10px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: PALETTE.text,
              textDecoration: 'none',
            }}
          >
            👤 Mon profil
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '9px 10px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              color: PALETTE.coral,
              background: 'transparent',
              border: 'none',
              cursor: loading ? 'default' : 'pointer',
              textAlign: 'left',
            }}
          >
            🚪 {loading ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      )}
    </div>
  );
}
