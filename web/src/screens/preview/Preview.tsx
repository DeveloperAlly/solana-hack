// Reuse the existing registered screens; previews never call the backend (delivery #114).
import { Fragment } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { findScreen } from '../../gallery/registry';
import { GalleryModeContext } from '../../ui/hooks/galleryMode';
import { PreviewRoutesContext } from '../../ui/hooks/previewRoutes';
import { BrandKeyed } from '../../flows/brand/BrandKeyed';
import { Alert, Container, Link } from '../../ui/primitives';
import type { ArtboardName } from '../../config/artboards';
import type { ScreenState } from '../../ui/composites/DemoStateSwitcher';

export function Preview({ artboard: board }: { artboard?: ArtboardName }) {
  const params = useParams();
  const [query] = useSearchParams();
  const entry = findScreen(board ?? params.artboard);
  if (!entry) return <Container><Alert tone="warning">This preview is not available. <Link href="/screens">Browse screens</Link></Alert></Container>;
  const requested = query.get('state') as ScreenState;
  const state = entry.states.includes(requested) ? requested : entry.states[0];
  return <PreviewRoutesContext.Provider value={true}><GalleryModeContext.Provider value={true}>
    <Container><Alert tone="info" title="Product preview">Sample data. Changes here demonstrate the flow and do not publish, pay, or register anything. <Link href="/home">Return to your brand</Link></Alert></Container>
    <BrandKeyed><Fragment key={`${entry.artboard}:${state}`}>{entry.render(state)}</Fragment></BrandKeyed>
  </GalleryModeContext.Provider></PreviewRoutesContext.Provider>;
}
