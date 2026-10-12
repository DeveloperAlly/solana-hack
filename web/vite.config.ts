import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // axe-core on a full jsdom page (e.g. /system with every workbench example) is slow on shared CI runners.
    // Measured 2026-10-12 with --reporter=verbose: the slowest test is public.test.tsx "/system ... no axe violations"
    // at 7.65 s locally (the workbench now renders every example), over the 5 s default; CI runners are slower still.
    testTimeout: 30_000,
  },
});
