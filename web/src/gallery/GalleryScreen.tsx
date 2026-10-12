import { useParams, useSearchParams } from 'react-router';
import { Container, Link } from '../ui/primitives';
import { EmptyState } from '../ui/composites/EmptyState';
import { DemoStateSwitcher, type ScreenState } from '../ui/composites/DemoStateSwitcher';
import { SampleFlag } from '../ui/composites/SampleFlag';
import { GalleryModeContext } from '../ui/hooks/galleryMode';
import { findScreen } from './registry';
import { GalleryToolbar } from './GalleryToolbar';
import { useGalleryTheme, useThemeQuery, withParam } from './useGalleryTheme';
import styles from './Gallery.module.css';

const pick = (v: string | null, allowed: readonly ScreenState[]): ScreenState => (allowed as readonly (string | null)[]).includes(v) ? (v as ScreenState) : allowed[0];

/** /screens/:artboard?state=&theme=: one screen with its fixture data, a state switcher (C28) and a theme switch. */
export function GalleryScreen() {
  const { artboard } = useParams();
  const [params] = useSearchParams();
  const theme = useGalleryTheme();
  const q = useThemeQuery();
  const entry = findScreen(artboard);

  if (!entry) {
    return (
      <div className={styles.page}>
        <Container as="main" width="reading">
          <EmptyState level={1} title="No such screen" body={`Nothing is registered as "${artboard ?? ''}".`} actions={<Link href={`/screens${q}`}>All screens</Link>} />
        </Container>
      </div>
    );
  }
  const state = pick(params.get('state'), entry.states);
  return (
    <div className={styles.frame}>
      {/* The screen comes first so its shell's skip link is the page's first focusable element. It scrolls inside the
          stage, and the gallery bar sits below the stage, always in view (Codex review on PR #66), so visual and focus
          order agree. */}
      {/* Gallery mode makes the screen's shell actions inert (no sign out, no network; Codex review on PR #79). */}
      <div className={styles.stage}><GalleryModeContext.Provider value={true}>{entry.render(state)}</GalleryModeContext.Provider></div>
      <GalleryToolbar placement="bottom" theme={theme} title={<><Link href={`/screens${q}`}>All screens</Link> / {entry.artboard}</>}>
        {/* Every gallery screen renders fixtures, so the frame says so once (Codex review on PR #66). */}
        <SampleFlag />
        <DemoStateSwitcher states={entry.states} value={state} hrefFor={(s) => withParam(params, 'state', s)} />
      </GalleryToolbar>
    </div>
  );
}
