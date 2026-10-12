import styles from './Placeholder.module.css';

export type PlaceholderRatio = 'square' | 'landscape' | 'portrait' | 'wide';

export interface PlaceholderProps {
  /** What the real image will show; this is the image's alt text. */
  label: string;
  ratio?: PlaceholderRatio;
}

/**
 * Placeholder image: a local inline SVG (crossed box, wireframe style) standing in for a real image.
 * No network request; strokes use currentColor and the fill uses tokens, so every theme restyles it.
 */
export function Placeholder({ label, ratio = 'landscape' }: PlaceholderProps) {
  return (
    <svg role="img" aria-label={label} className={`${styles.ph} ${styles[ratio]}`} viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" stroke="currentColor">
      <rect x="0.5" y="0.5" width="99" height="99" />
      <path d="M0 0L100 100M100 0L0 100" />
    </svg>
  );
}
