import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE, capitalize } from '../_shared/theme';
import MessageForm from './MessageForm';
import PageHeading from '../_shared/PageHeading';

type MessageRow = {
  id: string;
  text: string;
  author_id: string | null;
  created_at: string;
};

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return capitalize(
    d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) +
      ' · ' +
      d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  );
}

export default async function MessagesPage() {
  const { supabase, householdId, ownParent, parents } = await requireHousehold('messages');

  let messages: MessageRow[] = [];
  if (householdId) {
    const { data } = await supabase
      .from('messages')
      .select('id, text, author_id, created_at')
      .eq('household_id', householdId)
      .order('created_at', { ascending: false });
    messages = data ?? [];
  }

  const authorName = (id: string | null) => parents.find((p) => p.id === id)?.name ?? 'Parent';

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/messages" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 920 }}>
        <PageHeading title="Messages" subtitle="Messagerie entre parents" />

        <div className="twoColGrid">
          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Nouveau message</div>
            {householdId && ownParent ? (
              <MessageForm householdId={householdId} authorId={ownParent.id} />
            ) : (
              <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun foyer relié à ce compte.</p>
            )}
          </div>

          <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Échanges</div>
            <div>
              {messages.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun message pour le moment.</p>}
              {messages.map((m) => (
                <div key={m.id} style={{ padding: '10px 0', borderBottom: `1px solid ${PALETTE.divider}` }}>
                  <div style={{ fontSize: 12, color: PALETTE.muted }}>
                    {authorName(m.author_id)} · {fmtDateTime(m.created_at)}
                  </div>
                  <p style={{ fontSize: 13, margin: '4px 0 0' }}>{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
