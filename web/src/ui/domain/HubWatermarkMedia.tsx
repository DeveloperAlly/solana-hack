import { Placeholder, type PlaceholderRatio } from './Placeholder';
import styles from './HubWatermarkMedia.module.css';

export interface HubWatermarkMediaProps {
  /** What the image shows (its alt text). */
  label: string;
  /** False when no watermark was detected: the stamp reads "Label missing" and takes the danger style. */
  stamped?: boolean;
  ratio?: PlaceholderRatio;
}

/**
 * D46 WatermarkOverlay: the "AI-generated" stamp over persona media (canvas Influencer-Setup preview, Influencer-Queue).
 * States: present, missing. The image is a local Placeholder, never a remote file.
 */
export function HubWatermarkMedia({ label, stamped = true, ratio = 'landscape' }: HubWatermarkMediaProps) {
  return (
    <figure className={styles.frame}>
      <Placeholder label={label} ratio={ratio} />
      <figcaption className={[styles.mark, !stamped && styles.missing].filter(Boolean).join(' ')}>
        {stamped ? 'AI-generated' : 'Label missing'}
      </figcaption>
    </figure>
  );
}
