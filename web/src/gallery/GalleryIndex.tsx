import { Container, Heading, Link, Stack, Text } from '../ui/primitives';
import { Card } from '../ui/composites/Card';
import { ComingSoonFlag } from '../ui/domain/ComingSoonFlag';
import { canvasPages } from '../screens/registry-types';
import { allScreens } from './registry';
import { GalleryToolbar } from './GalleryToolbar';
import { ScreenLink } from './ScreenLink';
import { useGalleryTheme } from './useGalleryTheme';
import styles from './Gallery.module.css';

const repo = 'https://github.com/DeveloperAlly/solana-hack';

/** /screens: every registered screen, grouped by canvas page. Public, read-only, no network calls (issue #46). */
export function GalleryIndex() {
  const theme = useGalleryTheme();
  return (
    <div className={styles.page}>
      <GalleryToolbar title="Screen gallery" theme={theme} />
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
                        <ScreenLink artboard={s.artboard}>{s.artboard}</ScreenLink>
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
