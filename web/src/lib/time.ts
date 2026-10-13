// The one "now" for records made in the browser session (tips, invites, ratings, registrations).

/** "2026-10-13T09:41" for now, in the viewer's local time (the format the date formatter reads). */
export function nowIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
