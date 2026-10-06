import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

export function renderWithRouter(ui: ReactElement, path = '/') {
  return render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);
}
