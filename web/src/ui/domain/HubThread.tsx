import styles from './HubThread.module.css';

export interface HubThreadMessage {
  id: string;
  /** "me" is the brand side (sent from JamJam); "them" is the other person. */
  from: 'me' | 'them';
  text: string;
}

export interface HubThreadProps {
  /** Accessible name, e.g. the contact's name. */
  label: string;
  messages: HubThreadMessage[];
}

/**
 * D39 ThreadView: a conversation as in and out bubbles (canvas Inbox-All reading pane). Who sent each message is said
 * in words for screen readers, not only by position. Empty thread renders nothing.
 */
export function HubThread({ label, messages }: HubThreadProps) {
  if (messages.length === 0) return null;
  return (
    <ol className={styles.thread} aria-label={label}>
      {messages.map((m) => (
        <li key={m.id} className={[styles.bubble, m.from === 'me' ? styles.me : styles.them].join(' ')}>
          <span className="wl-visually-hidden">{m.from === 'me' ? 'You: ' : 'Them: '}</span>
          {m.text}
        </li>
      ))}
    </ol>
  );
}
