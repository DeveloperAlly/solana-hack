import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../../gallery/GalleryScreen';
import { screenPath } from '../../../gallery/screenPath';
import type { ScreenState } from '../../../ui/composites/DemoStateSwitcher';
import { resetHubSession } from '../hooks/useHubSession';

/**
 * Renders the real gallery route `/screens/:artboard`, so links between screens navigate as they do in the app.
 * Each render starts a fresh hub session.
 */
export function renderScreen(artboard: string, state?: string, theme?: string) {
  resetHubSession();
  const path = screenPath(artboard, state as ScreenState | undefined, new URLSearchParams(theme ? { theme } : {}));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
