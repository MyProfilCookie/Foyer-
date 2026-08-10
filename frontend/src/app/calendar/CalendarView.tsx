'use client';

import { useMemo, useState } from 'react';
import EventForm from './EventForm';
import DeleteEventButton from './DeleteEventButton';
import { colorForEvent } from './eventColors';
import { PALETTE, capitalize } from '../_shared/theme';

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  child_id: string | null;
  color: string | null;
};

type Props = {
  householdId: string;
  parentId: string;
  children: { id: string; name: string }[];
  events: EventRow[];
  canDelete: boolean;
};

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const navBtnStyle: React.CSSProperties = {
  border: 'none',
  background: PALETTE.coralBg,
  color: PALETTE.coralText,
  width: 30,
  height: 30,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: 16,
};

export default function CalendarView({ householdId, parentId, children, events, canDelete }: Props) {
  const today = useMemo(() => new Date(), []);
  const todayStr = toISODate(today);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const cells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const ev of events) {
      const list = map.get(ev.event_date) ?? [];
      list.push(ev);
      map.set(ev.event_date, list);
    }
    return map;
  }, [events]);

  const childName = (id: string | null) => children.find((c) => c.id === id)?.name;
  const existingTypes = useMemo(
    () => Array.from(new Set(events.map((ev) => ev.event_type).filter(Boolean))),
    [events]
  );
  const monthLabel = capitalize(currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedDateIsPast = selectedDate < todayStr;
  const selectedDateLabel = capitalize(
    new Date(`${selectedDate}T00:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  );

  return (
    <>
      <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16 }}>{monthLabel}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              style={navBtnStyle}
              aria-label="Mois précédent"
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            >
              ‹
            </button>
            <button
              type="button"
              style={{ border: 'none', background: PALETTE.coral, color: '#fff', borderRadius: 12, padding: '0 12px', height: 30, fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              onClick={() => {
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDate(todayStr);
              }}
            >
              Aujourd’hui
            </button>
            <button
              type="button"
              style={navBtnStyle}
              aria-label="Mois suivant"
              onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            >
              ›
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: PALETTE.muted, textAlign: 'center', padding: '2px 0', minWidth: 0 }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map(({ date, inMonth }) => {
            const dateStr = toISODate(date);
            const dayEvents = eventsByDate.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            return (
              <button
                type="button"
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                style={{
                  background: isSelected ? PALETTE.coralBg : inMonth ? '#FAFAFA' : 'transparent',
                  border: isSelected ? `1.5px solid ${PALETTE.coral}` : '1.5px solid transparent',
                  borderRadius: 12,
                  minWidth: 0,
                  minHeight: 78,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: inMonth ? PALETTE.text : '#c7c2b8',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: isToday ? PALETTE.coral : 'transparent',
                    color: isToday ? '#fff' : 'inherit',
                  }}
                >
                  {date.getDate()}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
                  {dayEvents.slice(0, 3).map((ev) => {
                    const color = colorForEvent(ev);
                    return (
                      <span
                        key={ev.id}
                        title={`${ev.title} · ${ev.event_type}${childName(ev.child_id) ? ` · ${childName(ev.child_id)}` : ''}`}
                        style={{
                          fontSize: 10.5,
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          background: `color-mix(in srgb, ${color} 22%, white)`,
                          color,
                        }}
                      >
                        {ev.title}
                      </span>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span style={{ fontSize: 10.5, fontWeight: 600, color: PALETTE.muted }}>+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="twoColGrid">
        <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            Ajouter le {selectedDateLabel}
          </div>
          {selectedDateIsPast ? (
            <p style={{ fontSize: 13, color: PALETTE.muted, margin: 0, lineHeight: 1.5 }}>
              Cette date est passée. Vous pouvez consulter les rendez-vous existants, mais vous ne pouvez plus en ajouter.
            </p>
          ) : (
            <EventForm
              key={selectedDate}
              householdId={householdId}
              parentId={parentId}
              children={children}
              defaultDate={selectedDate}
              existingTypes={existingTypes}
            />
          )}
        </div>

        <div style={{ background: PALETTE.card, borderRadius: 18, boxShadow: PALETTE.cardShadow, padding: 18 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
            {selectedDateLabel}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selectedEvents.length === 0 && <p style={{ fontSize: 13, color: PALETTE.mutedLight, margin: 0 }}>Aucun événement ce jour-là.</p>}
            {selectedEvents.map((ev) => {
              const name = childName(ev.child_id);
              const color = colorForEvent(ev);
              return (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, fontSize: 13 }}>
                  <div style={{ minWidth: 0 }}>
                    {ev.title}
                    {name && <div style={{ fontSize: 12, color: PALETTE.muted, marginTop: 2 }}>{name}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
                    <span
                      style={{
                        background: `color-mix(in srgb, ${color} 18%, white)`,
                        color,
                        padding: '4px 10px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {ev.event_type}
                    </span>
                    {canDelete && <DeleteEventButton eventId={ev.id} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
