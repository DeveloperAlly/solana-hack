import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../../gallery/GalleryScreen';
import { screenPath } from '../../../gallery/screenPath';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { resetHubSession } from '../hooks/useHubSession';
import { routes } from '../../../config/routes';
import { campaignStore } from '../../../flows/campaign/draft';
import type { ArtboardName } from '../../../config/artboards';

/**
 * Renders the real gallery screen route (from the route table), so links between screens navigate as they do in the app.
 * Each render starts a fresh hub session and a new campaign draft, unless `freshSession` is false (a later visit).
 */
const galleryRoute = routes.find((r) => r.screen === 'gallery-screen')!.path;

export function renderScreen(artboard: ArtboardName, state?: string, theme?: string, { freshSession = true } = {}) {
  if (freshSession) {
    resetHubSession();
    campaignStore.reset();
  }
  const path = screenPath(artboard, state as ScreenState | undefined, new URLSearchParams(theme ? { theme } : {}));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={galleryRoute} element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
