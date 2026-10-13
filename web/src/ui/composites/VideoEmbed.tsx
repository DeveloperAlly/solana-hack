import { useState } from 'react';
import styles from './VideoEmbed.module.css';

export interface VideoEmbedProps {
  /** YouTube video id, e.g. "Eu9afP-0FJ8" from https://youtu.be/Eu9afP-0FJ8. */
  youtubeId: string;
  /** Accessible name for the play button and the player (WCAG 4.1.2). */
  title: string;
}

/**
 * A 16:9 YouTube video that scales with its column. Nothing loads from YouTube until the viewer presses play: until
 * then it is the video's thumbnail and a play button, so the page makes no third-party calls and carries none of the
 * player's own markup. On play it swaps in the player (autoplay) from youtube-nocookie.com, YouTube's privacy-enhanced
 * mode, with strict-origin-when-cross-origin, the referrer policy YouTube requires for embeds
 * (https://developers.google.com/youtube/terms/required-minimum-functionality#embedded-player-api-client-identity).
 */
export function VideoEmbed({ youtubeId, title }: VideoEmbedProps) {
  const [playing, setPlaying] = useState(false);
  const id = encodeURIComponent(youtubeId);
  return (
    <div className={styles.frame}>
      {playing ? (
        <iframe
          className={styles.player}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" className={styles.poster} onClick={() => setPlaying(true)}>
          <img className={styles.thumb} src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className={styles.play}><span aria-hidden="true">▶</span> Watch the demo</span>
        </button>
      )}
    </div>
  );
}
