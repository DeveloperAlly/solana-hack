import { useParams, useSearchParams } from 'react-router';
import { Container, Heading, Link, Stack, Text } from '../ui/primitives';
import { Card } from '../ui/composites/Card';
import { EmptyState } from '../ui/composites/EmptyState';
import { DemoStateSwitcher, screenStates, type ScreenState } from '../ui/composites/DemoStateSwitcher';
import { ComingSoonFlag } from '../ui/domain/ComingSoonFlag';
import { canvasPages } from '../screens/registry-types';
import { allScreens, findScreen } from './registry';
import { ThemeSwitch } from './ThemeSwitch';
import { useGalleryTheme, withParam } from './useGalleryTheme';
import styles from './Gallery.module.css';

const repo = 'https://github.com/DeveloperAlly/solana-hack';

/** Keeps ?theme= when moving between gallery pages. */
function useThemeQuery(): string {
  const [params] = useSearchParams();
  const t = params.get('theme');
  return t ? `?theme=${encodeURIComponent(t)}` : '';
}

/** /screens: every registered screen, grouped by canvas page. Public, read-only, no network calls (issue #46). */
export function GalleryIndex() {
  const theme = useGalleryTheme();
  const q = useThemeQuery();
  return (
    <div className={styles.page}>
      <aside aria-label="Gallery controls" className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Screen gallery</span>
        <ThemeSwitch value={theme} />
      </aside>
      <Container as="main" width="app">
        <Stack gap={8}>
          <Stack gap={2}>
            <Heading level={1}>Screens</Heading>
            <Text tone="secondary">
              Every wireframe artboard built so far, with sample data. {allScreens.length} registered. Components are on the <Link href="/system">workbench</Link>.
            </Text>
          </Stack>
          {canvasPages.map((page) => {
            const screens = allScreens.filter((s) => s.page === page.id);
            const headingId = `page-${page.id}`;
            return (
              <Card key={page.id} labelledBy={headingId}>
                <Stack direction="row" gap={3} align="baseline" wrap>
                  <Heading level={2} size="xl" id={headingId}>{page.name}</Heading>
                  <Text variant="small" tone="secondary">
                    {screens.length} built · <Link href={`${repo}/issues/${page.issue}`} external>issue #{page.issue}</Link>
                  </Text>
                </Stack>
                {screens.length === 0 ? (
                  <Text tone="secondary">No screens registered yet.</Text>
                ) : (
                  <ul className={styles.list}>
                    {screens.map((s) => (
                      <li key={s.artboard} className={styles.row}>
                        <Link href={`/screens/${s.artboard}${q}`}>{s.artboard}</Link>
                        <Text as="span" variant="small" tone="secondary">{s.title}</Text>
                        <ComingSoonFlag tag={s.tag} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </Stack>
      </Container>
    </div>
  );
}

function isState(v: string | null, allowed: readonly ScreenState[]): v is ScreenState {
  return v !== null && (allowed as readonly string[]).includes(v);
}

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
  const requested = params.get('state');
  const state = isState(requested, entry.states) ? requested : entry.states[0] ?? screenStates[0];
  return (
    <div className={styles.page}>
      <aside aria-label="Gallery controls" className={styles.toolbar}>
        <span className={styles.toolbarTitle}>
          <Link href={`/screens${q}`}>All screens</Link> / {entry.artboard}
        </span>
        <DemoStateSwitcher states={entry.states} value={state} hrefFor={(s) => withParam(params, 'state', s)} />
        <ThemeSwitch value={theme} />
      </aside>
      {entry.render(state)}
    </div>
  );
}
