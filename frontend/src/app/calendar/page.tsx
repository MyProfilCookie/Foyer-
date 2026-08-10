import { requireHousehold } from '@/lib/household';
import Sidebar from '../_shared/Sidebar';
import { PALETTE } from '../_shared/theme';
import CalendarView from './CalendarView';
import PageHeading from '../_shared/PageHeading';

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  child_id: string | null;
  color: string | null;
};

export default async function CalendarPage() {
  const { supabase, householdId, ownParent, children } = await requireHousehold('calendar');

  let events: EventRow[] = [];
  if (householdId) {
    const { data } = await supabase
      .from('events')
      .select('id, title, event_date, event_type, child_id, color')
      .eq('household_id', householdId)
      .order('event_date');
    events = data ?? [];
  }

  return (
    <div className="pageShell" style={{ minHeight: '100vh', background: PALETTE.bgGradient, fontFamily: 'var(--font-body)', color: PALETTE.text }}>
      <Sidebar active="/calendar" ownParent={ownParent} />

      <div className="pageContent" style={{ maxWidth: 920 }}>
        <PageHeading title="Calendrier" subtitle="Rendez-vous et périodes de garde du foyer" />

        {householdId && ownParent ? (
          <CalendarView householdId={householdId} parentId={ownParent.id} children={children} events={events} canDelete={ownParent.role === 'owner' || ownParent.role === 'admin'} />
        ) : (
          <p style={{ fontSize: 13, color: PALETTE.mutedLight }}>Aucun foyer relié à ce compte.</p>
        )}
      </div>
    </div>
  );
}
