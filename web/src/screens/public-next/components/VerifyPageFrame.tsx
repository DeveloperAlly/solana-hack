import type { ReactNode } from 'react';
import { PublicShell } from '../../../ui/shells/PublicShell';
import { Container, Stack } from '../../../ui/primitives';
import { useSearchParams } from 'react-router';
import type { ArtboardName } from '../../../config/artboards';
import { useScreenHref } from '../../../gallery/screenPath';
import { verifyArtboards } from '../paths';

/**
 * Public nav targets inside the screen gallery, so the logo and header links keep the gallery and its theme
 * (PublicShell navHref; Codex review on PR #85). Verify and Ledger open their artboards; a route whose artboard is not
 * in this gallery opens the gallery index.
 */
export const galleryPublicTarget: Record<string, ArtboardName> = {
  '/verify': verifyArtboards.match,
  '/ledger': verifyArtboards.ledger,
};

/** The public page frame every Verify and Ledger screen sits in: public nav (L10), app width, canvas spacing. */
export function VerifyPageFrame({ children }: { children: ReactNode }) {
  const href = useScreenHref();
  const [params] = useSearchParams();
  const theme = params.get('theme');
  const index = `/screens${theme ? `?theme=${encodeURIComponent(theme)}` : ''}`;
  const navHref = (path: string) => (galleryPublicTarget[path] ? href(galleryPublicTarget[path]) : index);
  return (
    <PublicShell navHref={navHref}>
      <Container width="app">
        <Stack gap={6}>{children}</Stack>
      </Container>
    </PublicShell>
  );
}
