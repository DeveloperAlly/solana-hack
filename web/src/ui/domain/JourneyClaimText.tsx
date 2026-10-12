import styles from './JourneyClaimText.module.css';

/** A run of post text; runs with `claimId` are claims linked to evidence. */
export interface JourneyClaimSegment {
  text: string;
  claimId?: string;
}

export interface JourneyClaimTextProps {
  segments: JourneyClaimSegment[];
  /** The claim whose evidence is showing. */
  selected?: string;
  onSelect: (claimId: string) => void;
}

/**
 * JourneyClaimText (inventory P27 Highlight, flag mode, made selectable): post text with each claim highlighted as a
 * button; pressing one shows its evidence (canvas board J6-First-Post, "Highlighted = a claim linked to evidence";
 * issue #48). The highlight is an underline plus fill, and the button says "claim", so it never rests on colour.
 */
export function JourneyClaimText({ segments, selected, onSelect }: JourneyClaimTextProps) {
  return (
    <p className={styles.text}>
      {segments.map((s, i) =>
        s.claimId ? (
          <button
            key={i}
            type="button"
            className={[styles.claim, s.claimId === selected && styles.selected].filter(Boolean).join(' ')}
            aria-pressed={s.claimId === selected}
            onClick={() => onSelect(s.claimId as string)}
          >
            <span className="wl-visually-hidden">Claim: </span>
            {s.text}
          </button>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </p>
  );
}
