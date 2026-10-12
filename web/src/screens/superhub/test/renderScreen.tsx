import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { GalleryScreen } from '../../../gallery/Gallery';

/** Renders the real gallery route `/screens/:artboard`, so links between screens navigate as they do in the app. */
export function renderScreen(artboard: string, state?: string) {
  const path = `/screens/${artboard}${state ? `?state=${state}` : ''}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/screens/:artboard" element={<GalleryScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}
