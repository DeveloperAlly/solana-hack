import styles from './SoonWeekCalendar.module.css';

export type SoonSlotStatus = 'failed' | 'scheduled' | 'open';

export interface SoonCalendarSlot {
  id: string;
  day: string;
  /** Text shown in the slot, e.g. "09:00 X" or "[open slot]". */
  label: string;
  status: SoonSlotStatus;
}

export interface SoonWeekCalendarProps {
  /** Accessible name of the calendar. */
  label: string;
  days: string[];
  slots: SoonCalendarSlot[];
  /** The open slot picked for scheduling. */
  selectedId?: string | null;
  /** Called when an open slot is picked. Scheduled and failed slots are not buttons. */
  onSelect?: (id: string) => void;
}

const suffix: Record<SoonSlotStatus, string> = { failed: ' · failed', scheduled: '', open: '' };

/** D8 week view (canvas Publish-Calendar): a column per day; open slots can be picked; failed slots are marked in text. */
export function SoonWeekCalendar({ label, days, slots, selectedId, onSelect }: SoonWeekCalendarProps) {
  return (
    <div className={styles.grid} role="group" aria-label={label}>
      {days.map((day) => (
        <section key={day} className={styles.day} aria-label={day}>
          <p className={styles.dayName}>{day}</p>
          <ul className={styles.slots}>
            {slots.filter((s) => s.day === day).map((s) => (
              <li key={s.id}>
                {s.status === 'open' && onSelect ? (
                  <button type="button" className={[styles.slot, styles.open, selectedId === s.id && styles.selected].filter(Boolean).join(' ')} aria-pressed={selectedId === s.id} onClick={() => onSelect(s.id)}>
                    {s.label}
                  </button>
                ) : (
                  <span className={[styles.slot, styles[s.status]].join(' ')}>{s.label}{suffix[s.status]}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
