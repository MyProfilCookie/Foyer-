'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NAV_ITEMS, PALETTE, canAccessSection } from './theme';
import FamilyIcon, { type FamilyIconName } from './FamilyIcon';

type OwnParent = { role?: string | null; permissions?: string[] | null } | null;

const NAV_ICONS: Record<string, FamilyIconName> = {
  '/dashboard': 'dashboard',
  '/calendar': 'calendar',
  '/expenses': 'expenses',
  '/homework': 'homework',
  '/journal': 'journal',
  '/messages': 'messages',
  '/profile': 'profile',
};

export default function Sidebar({ active, ownParent }: { active: string; ownParent: OwnParent }) {
  const [open, setOpen] = useState(false);
  const items = NAV_ITEMS.filter((item) => !item.section || canAccessSection(ownParent, item.section));

  const navLinkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: 14,
    textDecoration: 'none',
    color: isActive ? PALETTE.coral : PALETTE.text,
    background: isActive ? PALETTE.coralBg : 'transparent',
    fontWeight: 600,
    fontSize: 14,
  });

  return (
    <>
      {/* Desktop vertical sidebar */}
      <aside
        className="sidebarDesktop"
        style={{ width: 220, flex: 'none', padding: '28px 18px', flexDirection: 'column', gap: 24 }}
      >
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 20, color: PALETTE.coral, textDecoration: 'none' }}
        >
          Foyer+
        </Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} style={navLinkStyle(item.href === active)}>
              <FamilyIcon name={NAV_ICONS[item.href]} size={28} />
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            color: PALETTE.muted,
            textDecoration: 'none',
          }}
        >
          ← Retour au site
        </Link>
      </aside>

      {/* Mobile top bar */}
      <div
        className="sidebarMobileBar"
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: `1px solid ${PALETTE.divider}`,
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: PALETTE.bg,
        }}
      >
        <Link
          href="/dashboard"
          style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 18, color: PALETTE.coral, textDecoration: 'none' }}
        >
          Foyer+
        </Link>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          onClick={() => setOpen((o) => !o)}
          style={{
            border: 'none',
            background: PALETTE.coralBg,
            color: PALETTE.coralText,
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <div
        className={`sidebarMobileMenu${open ? ' isOpen' : ''}`}
        style={{
          flexDirection: 'column',
          gap: 4,
          padding: '12px 16px 16px',
          borderBottom: `1px solid ${PALETTE.divider}`,
          background: PALETTE.bg,
          position: 'sticky',
          top: 58,
          zIndex: 29,
        }}
      >
        {items.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)} style={navLinkStyle(item.href === active)}>
            <FamilyIcon name={NAV_ICONS[item.href]} size={28} />
            {item.label}
          </Link>
        ))}
        <Link
          href="/"
          onClick={() => setOpen(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            fontSize: 13,
            fontWeight: 600,
            color: PALETTE.muted,
            textDecoration: 'none',
          }}
        >
          ← Retour au site
        </Link>
      </div>
    </>
  );
}
