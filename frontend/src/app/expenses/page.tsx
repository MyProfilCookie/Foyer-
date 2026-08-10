import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE, capitalize } from '../_shared/theme';
import ExpenseForm from './ExpenseForm';
import ExpenseActions from './ExpenseActions';
import PageHeading from '../_shared/PageHeading';

type ExpenseRow = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  status: string;
  note: string | null;
  paid_by_id: string | null;
  receipt_url: string | null;
};

type DisplayExpenseRow = ExpenseRow & { receiptSignedUrl: string | null };

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtShort(d: Date) {
  return capitalize(d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
}

export default async function ExpensesPage() {
  const { supabase, householdId, ownParent, parents } = await requireHousehold('expenses');

  let expenses: DisplayExpenseRow[] = [];
  if (householdId) {
    const { data } = await supabase
      .from('expenses')
      .select('id, expense_date, category, amount, status, note, paid_by_id, receipt_url')
      .eq('household_id', householdId)
      .order('expense_date', { ascending: false });
    expenses = await Promise.all((data ?? []).map(async (expense) => {
      if (!expense.receipt_url) return { ...expense, receiptSignedUrl: null };
      const { data: signed } = await supabase.storage
        .from('receipts')
        .createSignedUrl(expense.receipt_url, 60 * 10);
      return { ...expense, receiptSignedUrl: signed?.signedUrl ?? null };
    }));
  }

  const paidByName = (id: string | null) => parents.find((p) => p.id === id)?.name;
  const pending = expenses.filter((e) => e.status !== 'paid');
  const paid = expenses.filter((e) => e.status === 'paid');
  const pendingTotal = pending.reduce((sum, e) => sum + Number(e.amount), 0);

  function ExpenseRowItem({ e }: { e: DisplayExpenseRow }) {
    const name = paidByName(e.paid_by_id);
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 13, padding: '10px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
        <div style={{ minWidth: 0 }}>
          {e.category} — {Number(e.amount).toFixed(2)} €
          <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>
            {fmtShort(parseDate(e.expense_date))}
            {name ? ` · payé par ${name}` : ''}
          </div>
          {e.note && <p style={{ fontSize: 13, margin: '4px 0 0' }}>{e.note}</p>}
          {e.receiptSignedUrl && (
            <a
              href={e.receiptSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 6, fontSize: 12, fontWeight: 700, color: PALETTE.tealText, textDecoration: 'none' }}
            >
              📎 Voir le ticket
            </a>
          )}
        </div>
        <ExpenseActions expenseId={e.id} status={e.status} canDelete={ownParent?.role === 'owner' || ownParent?.role === 'admin'} />
      </div>
    );
  }

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/expenses" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 920 }}>
        <PageHeading title="Dépenses" subtitle={`${pendingTotal.toFixed(2)} € en attente de remboursement`} />

        <div className="twoColGrid">
          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Ajouter une dépense</div>
            {householdId && ownParent ? (
              <ExpenseForm householdId={householdId} parentId={ownParent.id} />
            ) : (
              <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun foyer relié à ce compte.</p>
            )}
          </div>

          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>En attente</div>
            <div>
              {pending.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucune dépense en attente.</p>}
              {pending.map((e) => (
                <ExpenseRowItem key={e.id} e={e} />
              ))}
            </div>

            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, margin: '18px 0 6px' }}>Remboursées</div>
            <div>
              {paid.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucune dépense remboursée.</p>}
              {paid.map((e) => (
                <ExpenseRowItem key={e.id} e={e} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
