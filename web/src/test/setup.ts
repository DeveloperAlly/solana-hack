import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  // The gallery remembers the tab's theme in sessionStorage; each test starts without it.
  sessionStorage.clear();
});
