import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE, capitalize } from '../_shared/theme';
import JournalForm from './JournalForm';
import DeleteEntryButton from './DeleteEntryButton';
import PageHeading from '../_shared/PageHeading';

type JournalRow = {
  id: string;
  entry_date: string;
  text: string;
  author_id: string | null;
  child_id: string | null;
};

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(d: Date) {
  return capitalize(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
}

export default async function JournalPage() {
  const { supabase, householdId, ownParent, parents, children } = await requireHousehold('journal');

  let entries: JournalRow[] = [];
  if (householdId) {
    const { data } = await supabase
      .from('journal_entries')
      .select('id, entry_date, text, author_id, child_id')
      .eq('household_id', householdId)
      .order('entry_date', { ascending: false });
    entries = data ?? [];
  }

  const authorName = (id: string | null) => parents.find((p) => p.id === id)?.name ?? 'Parent';
  const childName = (id: string | null) => children.find((c) => c.id === id)?.name;

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/journal" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 920 }}>
        <PageHeading title="Journal" subtitle="Observations et suivi des enfants" />

        <div className="twoColGrid">
          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Ajouter une observation</div>
            {householdId && ownParent ? (
              <JournalForm householdId={householdId} authorId={ownParent.id} children={children} />
            ) : (
              <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun foyer relié à ce compte.</p>
            )}
          </div>

          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Observations</div>
            <div>
              {entries.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucune observation pour le moment.</p>}
              {entries.map((j) => {
                const child = childName(j.child_id);
                return (
                  <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: PALETTE.muted }}>
                        {authorName(j.author_id)}
                        {child ? ` · ${child}` : ''} · {fmtShort(parseDate(j.entry_date))}
                      </div>
                      <p style={{ fontSize: 13, margin: '4px 0 0' }}>{j.text}</p>
                    </div>
                    <DeleteEntryButton entryId={j.id} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
