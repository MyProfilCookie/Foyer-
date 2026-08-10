import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE, capitalize } from '../_shared/theme';
import HomeworkForm from './HomeworkForm';
import HomeworkActions from './HomeworkActions';
import PageHeading from '../_shared/PageHeading';

type HomeworkRow = {
  id: string;
  subject: string;
  due_date: string;
  status: string;
  child_id: string | null;
};

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(d: Date) {
  return capitalize(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
}

export default async function HomeworkPage() {
  const { supabase, householdId, ownParent, children } = await requireHousehold('homework');

  let homework: HomeworkRow[] = [];
  if (householdId) {
    const { data } = await supabase
      .from('homework')
      .select('id, subject, due_date, status, child_id')
      .eq('household_id', householdId)
      .order('due_date');
    homework = data ?? [];
  }

  const childName = (id: string | null) => children.find((c) => c.id === id)?.name;
  const pending = homework.filter((h) => h.status !== 'done');
  const done = homework.filter((h) => h.status === 'done');

  function HomeworkRowItem({ h }: { h: HomeworkRow }) {
    const name = childName(h.child_id);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 13, padding: '10px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
        <div style={{ minWidth: 0 }}>
          {h.subject}
          {name ? ` — ${name}` : ''}
          <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>Pour le {fmtShort(parseDate(h.due_date))}</div>
        </div>
        <HomeworkActions homeworkId={h.id} status={h.status} canDelete={ownParent?.role === 'owner' || ownParent?.role === 'admin'} />
      </div>
    );
  }

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/homework" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 920 }}>
        <PageHeading title="Devoirs" subtitle="Suivi des devoirs à faire" />

        <div className="twoColGrid">
          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Ajouter un devoir</div>
            {householdId && children.length > 0 ? (
              <HomeworkForm householdId={householdId} children={children} />
            ) : (
              <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun enfant enregistré dans ce foyer.</p>
            )}
          </div>

          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>À faire</div>
            <div>
              {pending.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun devoir à faire.</p>}
              {pending.map((h) => (
                <HomeworkRowItem key={h.id} h={h} />
              ))}
            </div>

            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, margin: '18px 0 6px' }}>Faits</div>
            <div>
              {done.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun devoir terminé.</p>}
              {done.map((h) => (
                <HomeworkRowItem key={h.id} h={h} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
