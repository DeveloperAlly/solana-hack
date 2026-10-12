import styles from './Icon.module.css';

// Stroke paths on a 24-unit grid; colour comes from currentColor, so every theme restyles them.
const paths = {
  check: 'M6 12.5l4 4L18 8',
  alert: 'M12 7v6M12 16.5v.5',
  info: 'M12 11v6M12 7.5v.5',
  cross: 'M8 8l8 8M16 8l-8 8',
  plus: 'M12 7v10M7 12h10',
  'chevron-down': 'M7 10l5 5 5-5',
} as const;

export type IconName = keyof typeof paths;
export type IconSize = 'sm' | 'md' | 'lg';
/** Names drawn inside a circle (status glyphs). */
const circled: ReadonlySet<IconName> = new Set(['check', 'alert', 'info', 'cross']);

export interface IconProps {
  name: IconName;
  size?: IconSize;
  /** Accessible name. Leave it out for a decorative icon (hidden from assistive tech). */
  label?: string;
}

/** P10 Icon: a named stroke icon in currentColor; decorative unless labelled. */
export function Icon({ name, size = 'md', label }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  return (
    <svg {...a11y} className={`${styles.icon} ${styles[size]}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      {circled.has(name) && <circle cx="12" cy="12" r="10" />}
      <path d={paths[name]} />
    </svg>
  );
}
