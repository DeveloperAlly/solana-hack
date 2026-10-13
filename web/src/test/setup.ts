import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetActiveBrand } from '../flows/brand/activeBrand';
import { resetBrandCatalog } from '../flows/brand/brandCatalog';
import { resetRegisteredPosts } from '../flows/registry/registeredPosts';

afterEach(() => {
  cleanup();
  // The gallery remembers the tab's theme in sessionStorage; each test starts without it.
  sessionStorage.clear();
  // The active brand is app-wide session state (flows/brand/activeBrand); each test starts on the default brand.
  resetActiveBrand();
  resetBrandCatalog();
  // Posts registered this session are public and app-wide (flows/registry); each test starts with none.
  resetRegisteredPosts();
});
