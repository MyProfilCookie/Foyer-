import type { CSSProperties } from 'react';
import styles from './FamilyIcon.module.css';

export type FamilyIconName = 'dashboard' | 'calendar' | 'expenses' | 'homework' | 'journal' | 'messages' | 'profile' | 'family';

const COLORS: Record<FamilyIconName, [string, string]> = {
  dashboard: ['#ff6b7a', '#ffe5e8'],
  calendar: ['#ff6b7a', '#ffe5e8'],
  expenses: ['#31b9ad', '#dcf8f4'],
  homework: ['#f4ae24', '#fff1cb'],
  journal: ['#8568df', '#eee8ff'],
  messages: ['#8b63e6', '#eee7ff'],
  profile: ['#5f8fc5', '#e2efff'],
  family: ['#5f8fc5', '#e2efff'],
};

export default function FamilyIcon({ name, size = 56 }: { name: FamilyIconName; size?: number }) {
  const [color, pale] = COLORS[name];
  const vars = { '--fi-size': `${size}px`, '--fi-color': color, '--fi-pale': pale } as CSSProperties;
  return (
    <span className={`${styles.icon} ${styles[name]}`} style={vars} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        {name === 'dashboard' && <><path className={styles.tile} d="M8 29 32 8l24 21v25a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V29Z"/><path className={styles.line} d="M23 58V39h18v19M5 31 32 7l27 24"/></>}
        {name === 'calendar' && <><rect className={styles.tile} x="8" y="11" width="48" height="45" rx="14"/><path className={styles.line} d="M19 8v9M45 8v9M9 25h46"/><g className={styles.dots} fill="currentColor"><circle cx="21" cy="35" r="3"/><circle cx="32" cy="35" r="3"/><circle cx="43" cy="35" r="3"/><circle cx="21" cy="46" r="3"/><circle cx="32" cy="46" r="3"/></g></>}
        {name === 'expenses' && <><circle className={styles.tile} cx="32" cy="32" r="25"/><path className={`${styles.line} ${styles.wave}`} d="M15 34h9l4-12 7 23 5-16 3 5h7"/><circle className={styles.spark} cx="47" cy="17" r="4" fill="currentColor"/></>}
        {name === 'homework' && <><path className={styles.tile} d="M13 8h30l9 9v37H13z"/><path className={styles.line} d="M42 9v10h9M22 29h20M22 38h15"/><g className={styles.pencil}><path className={styles.line} d="m20 49 4-10 18-18 7 7-18 18-11 3Z"/><path className={styles.line} d="m24 39 7 7"/></g></>}
        {name === 'journal' && <><rect className={styles.tile} x="11" y="7" width="42" height="50" rx="11"/><path className={styles.line} d="M22 7v50M29 22h15M29 32h15M29 42h10"/><circle cx="17" cy="21" r="2" fill="currentColor"/><circle cx="17" cy="32" r="2" fill="currentColor"/></>}
        {name === 'messages' && <><path className={styles.tile} d="M8 13a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9v25a9 9 0 0 1-9 9H29L16 58l2-11h-1a9 9 0 0 1-9-9V13Z"/><g className={styles.messageDots} fill="currentColor"><circle cx="22" cy="27" r="3.5"/><circle cx="32" cy="27" r="3.5"/><circle cx="42" cy="27" r="3.5"/></g></>}
        {name === 'profile' && <><circle className={styles.tile} cx="32" cy="32" r="26"/><circle className={styles.line} cx="32" cy="24" r="9"/><path className={styles.line} d="M15 51c3-10 9-16 17-16s14 6 17 16"/></>}
        {name === 'family' && <><circle className={styles.tile} cx="32" cy="32" r="26"/><circle className={styles.line} cx="25" cy="25" r="7"/><circle className={styles.line} cx="43" cy="28" r="5"/><path className={styles.line} d="M12 49c2-9 8-14 15-14s13 5 15 14M39 39c6 0 10 4 12 10"/></>}
      </svg>
    </span>
  );
}
