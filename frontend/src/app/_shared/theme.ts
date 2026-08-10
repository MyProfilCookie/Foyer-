import type { CSSProperties } from 'react';

export const SECTIONS = ['calendar', 'expenses', 'homework', 'journal', 'messages'] as const;
export type Section = (typeof SECTIONS)[number];

export function canAccessSection(
  parent: { role?: string | null; permissions?: string[] | null } | null,
  section: Section
) {
  if (!parent) return false;
  if (parent.role === 'owner' || parent.role === 'admin') return true;
  return (parent.permissions ?? []).includes(section);
}

export function canAdminister(parent: { role?: string | null } | null) {
  return parent?.role === 'owner' || parent?.role === 'admin';
}

export const PALETTE = {
  bg: '#EAF6FF',
  bgGradient: 'linear-gradient(180deg, #EAF9FF 0%, #E3F1FF 50%, #F3EEFF 100%)',
  card: '#DCEEFF',
  cardShadow: '0 4px 16px rgba(51, 80, 108, 0.12), 0 1px 3px rgba(51, 80, 108, 0.08)',
  text: '#3A3A3A',
  muted: '#8a8a8a',
  mutedLight: '#999999',
  divider: '#CFE4F5',
  coral: '#FF6B6B',
  coralBg: '#FFE8E8',
  coralText: '#a15757',
  teal: '#4ECDC4',
  tealBg: '#E3FBF8',
  tealText: '#2d8b84',
  gold: '#FFB020',
  goldBg: '#FFF3D6',
  goldText: '#9a7018',
  purple: '#A78BFA',
  purpleBg: '#EFE7FF',
  purpleText: '#6d54a8',
};

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', emoji: '🏠', section: null },
  { href: '/calendar', label: 'Calendrier', emoji: '📅', section: 'calendar' as const },
  { href: '/expenses', label: 'Dépenses', emoji: '💶', section: 'expenses' as const },
  { href: '/homework', label: 'Devoirs', emoji: '📚', section: 'homework' as const },
  { href: '/journal', label: 'Journal', emoji: '📝', section: 'journal' as const },
  { href: '/messages', label: 'Messages', emoji: '💬', section: 'messages' as const },
  { href: '/profile', label: 'Profil', emoji: '👤', section: null },
];

export const SECTION_LABELS: Record<string, string> = {
  calendar: 'Calendrier',
  expenses: 'Dépenses',
  homework: 'Devoirs',
  journal: 'Journal',
  messages: 'Messages',
};

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr-FR').replace(
    /(^|[\s'’-])(\p{L})/gu,
    (_, separator: string, letter: string) => `${separator}${letter.toLocaleUpperCase('fr-FR')}`
  );
}

export const inputStyle: CSSProperties = {
  border: '1px solid #D6E7F5',
  background: '#F8FBFF',
  borderRadius: 12,
  padding: '10px 12px',
  fontSize: 14,
  color: PALETTE.text,
  fontFamily: 'inherit',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
};

export const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 600, color: PALETTE.muted };

export function primaryButtonStyle(loading = false): CSSProperties {
  return {
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
  };
}

export function ghostButtonStyle(color: string): CSSProperties {
  return {
    border: `1px solid ${color}`,
    background: 'transparent',
    color,
    borderRadius: 10,
    padding: '6px 12px',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 12,
    cursor: 'pointer',
  };
}

export function pillStyle(color: string): CSSProperties {
  return {
    background: `color-mix(in srgb, ${color} 18%, white)`,
    color,
    padding: '4px 10px',
    borderRadius: 8,
    fontSize: 11,
    fontWeight: 700,
  };
}
