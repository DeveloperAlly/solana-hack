import { useState, type ReactNode } from 'react';
import { Alert, Badge, Box, Button, Choice, Container, Field, Grid, Heading, Link, Stack, Text } from '../ui/primitives';
import { AppShell } from '../ui/shells/AppShell';
import type { BoxBackground, BoxBorder } from '../ui/primitives/Box';
import type { TextTone, TextVariant } from '../ui/primitives/Text';
import type { HeadingLevel } from '../ui/primitives/Heading';
import type { ContainerWidth } from '../ui/primitives/Container';
import { routes } from '../config/routes';
import { ThemeEditor, syncThemeOverrides } from './ThemeEditor';
import styles from './Workbench.module.css';

function Entry({ id, name, children }: { id: string; name: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`wb-${id}`} className={styles.entry}>
      <Heading level={3} size="lg" id={`wb-${id}`}>
        {id} {name}
      </Heading>
      <div className={styles.demo}>{children}</div>
    </section>
  );
}

const variants: TextVariant[] = ['body', 'small', 'caption', 'label', 'mono'];
const tones: TextTone[] = ['primary', 'secondary', 'success', 'warning', 'danger', 'info'];
const backgrounds: BoxBackground[] = ['none', 'canvas', 'surface', 'subtle', 'inverse'];
const borders: BoxBorder[] = ['none', 'default', 'strong', 'subtle'];
const levels: HeadingLevel[] = [1, 2, 3, 4];
const widths: ContainerWidth[] = ['reading', 'wizard', 'app', 'full'];
const badgeTones = ['neutral', 'solid', 'success', 'warning'] as const;
const alertTones = ['info', 'success', 'warning', 'danger'] as const;
const gridMins = ['sm', 'md', 'lg'] as const;

function ChoiceDemo() {
  const [v, setV] = useState('b');
  return <Choice legend="Choice legend" options={[{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }]} value={v} onChange={setV} />;
}

/** /system: every built component in every variant, plus the theme editor. */
export function Workbench() {
  return (
    <Container as="main" width="app">
      <Stack gap={8}>
        <Stack gap={2}>
          <Heading level={1}>Workbench</Heading>
          <Text tone="secondary">Every built component and variant. Theme: wireframe.</Text>
        </Stack>

        <Stack gap={6}>
          <Heading level={2}>Components</Heading>
          <Entry id="P1" name="Box">
            <Stack direction="row" gap={3} wrap>
              {backgrounds.map((b) => (
                <Box key={b} padding={4} background={b} border="default" radius="box">
                  <Text tone={b === 'inverse' ? 'inverse' : 'primary'}>background {b}</Text>
                </Box>
              ))}
              {borders.map((b) => (
                <Box key={b} padding={4} border={b} radius="control">
                  <Text>border {b}</Text>
                </Box>
              ))}
              <Box padding={2} paddingX={4} border="default" radius="pill">
                <Text>radius pill</Text>
              </Box>
            </Stack>
          </Entry>
          <Entry id="P2" name="Stack">
            <Stack gap={3}>
              {(['row', 'column'] as const).map((d) => (
                <Box key={d} padding={3} border="subtle" radius="box">
                  <Text variant="caption" tone="secondary">direction {d}, gap 3</Text>
                  <Stack direction={d} gap={3}>
                    <Box padding={2} background="subtle">One</Box>
                    <Box padding={2} background="subtle">Two</Box>
                    <Box padding={2} background="subtle">Three</Box>
                  </Stack>
                </Box>
              ))}
              <Box padding={3} border="subtle" radius="box">
                <Text variant="caption" tone="secondary">row, justify between, wrap</Text>
                <Stack direction="row" justify="between" wrap>
                  <Box padding={2} background="subtle">Start</Box>
                  <Box padding={2} background="subtle">End</Box>
                </Stack>
              </Box>
            </Stack>
          </Entry>
          <Entry id="P4" name="Container">
            <Stack gap={3}>
              {widths.map((w) => (
                <Box key={w} border="subtle" radius="box">
                  <Container width={w}>
                    <Box padding={2} background="subtle">
                      <Text variant="caption">width {w}</Text>
                    </Box>
                  </Container>
                </Box>
              ))}
              <Text variant="small" tone="secondary">Inside this page's app container, app and full fill the same space.</Text>
            </Stack>
          </Entry>
          <Entry id="P5" name="Text">
            <Stack gap={2}>
              {variants.map((v) => (
                <Text key={v} variant={v}>variant {v}</Text>
              ))}
              {tones.map((t) => (
                <Text key={t} tone={t}>tone {t}</Text>
              ))}
              <Box background="inverse" padding={2}>
                <Text tone="inverse">tone inverse</Text>
              </Box>
              <div className={styles.narrow}>
                <Text truncate>truncated text that is too long to fit in this narrow box</Text>
              </div>
            </Stack>
          </Entry>
          <Entry id="P6" name="Heading">
            <Stack gap={2}>
              {levels.map((l) => (
                <Heading key={l} level={l}>
                  Level {l} size
                </Heading>
              ))}
              <Heading level={4} size="4xl">Level 4, size 4xl</Heading>
            </Stack>
          </Entry>
          <Entry id="P7" name="Link">
            <Stack direction="row" gap={6} wrap>
              <Link href="/">Internal link</Link>
              <Link href="https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum" external>
                External link
              </Link>
            </Stack>
          </Entry>
          <Entry id="P8" name="Button">
            <Stack direction="row" gap={3} wrap align="center">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button href="/sign-in">Primary as link</Button>
              <Button href="/sign-in" variant="secondary">Secondary as link</Button>
              <Button disabled>Disabled</Button>
            </Stack>
            <Box paddingY={3}>
              <Button fullWidth variant="secondary">Full width</Button>
            </Box>
          </Entry>
          <Entry id="P9" name="Grid">
            <Stack gap={3}>
              {gridMins.map((m) => (
                <Box key={m} padding={3} border="subtle" radius="box">
                  <Text variant="caption" tone="secondary">min {m}, gap 3, as ul (list reset)</Text>
                  <Grid as="ul" min={m} gap={3}>
                    {['One', 'Two', 'Three', 'Four'].map((x) => <li key={x}><Box padding={2} background="subtle">{x}</Box></li>)}
                  </Grid>
                </Box>
              ))}
            </Stack>
          </Entry>
          <Entry id="C1" name="Field">
            <Stack gap={3}>
              <Field label="Label" hint="Hint text" value="" onChange={() => {}} />
              <Field label="With an error" error="Say what is wrong and how to fix it." value="" onChange={() => {}} />
              <Field label="Multiline" multiline rows={3} value="" onChange={() => {}} />
            </Stack>
          </Entry>
          <Entry id="C3" name="Choice">
            <ChoiceDemo />
          </Entry>
          <Entry id="C4" name="Alert">
            <Stack gap={3}>
              {alertTones.map((t) => <Alert key={t} tone={t} title={`Alert ${t}`}>Body text for the {t} alert.</Alert>)}
            </Stack>
          </Entry>
          <Entry id="C5" name="Badge">
            <Stack direction="row" gap={3} wrap>
              {badgeTones.map((t) => <Badge key={t} tone={t}>{t}</Badge>)}
            </Stack>
          </Entry>
          <Entry id="L1" name="AppShell">
            <Stack gap={3}>
              <Text variant="small" tone="secondary">With a brand name, then without. Nav comes from the route config (M1).</Text>
              <Box border="subtle" radius="box"><AppShell preview brandName="Sample brand"><Box padding={4}><Text>Main slot</Text></Box></AppShell></Box>
              <Box border="subtle" radius="box"><AppShell preview><Box padding={4}><Text>No brand yet</Text></Box></AppShell></Box>
            </Stack>
          </Entry>
          <Entry id="L10" name="PublicShell">
            <iframe
              className={styles.frame}
              title="PublicShell preview (landing)"
              src="/"
              data-theme-preview
              onLoad={(e) => syncThemeOverrides(e.currentTarget)}
            />
          </Entry>
          <Entry id="M1" name="Route config">
            <ul className={styles.list}>
              {routes.map((r) => (
                <li key={r.path}>
                  <code>{r.path}</code> {r.label}, {r.section}, {r.tag}
                </li>
              ))}
            </ul>
          </Entry>
        </Stack>

        <Stack gap={4}>
          <Heading level={2}>Theme editor</Heading>
          <Text tone="secondary">Changes apply to this page live. Export to save them as a theme file.</Text>
          <ThemeEditor />
        </Stack>
      </Stack>
    </Container>
  );
}
