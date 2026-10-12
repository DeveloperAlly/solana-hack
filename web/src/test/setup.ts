import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetActiveBrand } from '../flows/brand/activeBrand';

afterEach(() => {
  cleanup();
  // The gallery remembers the tab's theme in sessionStorage; each test starts without it. Files that run in the node
  // environment (// @vitest-environment node, e.g. source-intake.test.ts) have no sessionStorage.
  if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
  // The active brand is app-wide session state (flows/brand/activeBrand); each test starts on the default brand.
  resetActiveBrand();
});
