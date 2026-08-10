import { PALETTE } from './theme';

export default function PageHeading({ title, subtitle }: {
  title: string;
  subtitle: string;
}) {
  return (
    <header style={{ marginBottom: 24, padding: '14px 18px', width: 'fit-content', maxWidth: '100%', borderRadius: 20, background: 'rgba(255, 255, 255, 0.72)', boxShadow: '0 12px 30px rgba(64, 94, 126, 0.10)', border: '1px solid rgba(255, 255, 255, 0.75)' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 34px)', lineHeight: 1, letterSpacing: '-0.02em' }}>{title}</span>
        <span style={{ display: 'block', marginTop: 7, fontSize: 14, color: PALETTE.muted }}>{subtitle}</span>
      </span>
    </header>
  );
}
