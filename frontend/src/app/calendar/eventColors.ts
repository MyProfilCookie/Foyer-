export const DEFAULT_EVENT_COLOR = '#5980a6';

export function colorForEvent(ev: { color?: string | null }) {
  return ev.color || DEFAULT_EVENT_COLOR;
}
