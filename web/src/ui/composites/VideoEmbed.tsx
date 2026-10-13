import styles from './VideoEmbed.module.css';

export interface VideoEmbedProps {
  /** YouTube video id, e.g. "Eu9afP-0FJ8" from https://youtu.be/Eu9afP-0FJ8. */
  youtubeId: string;
  /** Accessible name for the player (required by WCAG 4.1.2 for iframes). */
  title: string;
}

/**
 * A 16:9 YouTube player that scales with its column. Uses youtube-nocookie.com (YouTube's privacy-enhanced mode, no
 * cookies until the viewer plays) and strict-origin-when-cross-origin, the referrer policy YouTube requires for embeds
 * (https://developers.google.com/youtube/terms/required-minimum-functionality#embedded-player-api-client-identity).
 */
export function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  return (
    <div className={styles.frame}>
      <iframe
        className={styles.player}
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    </div>
  );
}
