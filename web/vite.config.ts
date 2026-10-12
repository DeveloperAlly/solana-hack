import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/**
 * Stamps the build id into index.html (<meta name="jamjam-build">): the commit CI builds (JAMJAM_BUILD_ID), else
 * "local". check-gallery reads it to know the deployed preview is serving the commit under test before it checks.
 */
function buildId(): Plugin {
  const id = process.env.JAMJAM_BUILD_ID || 'local';
  return {
    name: 'jamjam-build-id',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'jamjam-build', content: id }, injectTo: 'head' }],
  };
}

export default defineConfig({
  plugins: [react(), buildId()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // axe-core on a full jsdom page (/system renders every workbench example) runs close to the 5 s default.
    // What was measured: the duration of public.test.tsx "/system renders its heading with no axe violations".
    // - PR #66 CI at 28b524c, 5 s default: 5377 ms, then "Test timed out in 5000ms" and "Axe is already running"
    //   (https://github.com/DeveloperAlly/solana-hack/actions/runs/38238215773/job/114774045700).
    // - PR #66 CI at 3b87aa4, this timeout: 4935 ms, passed
    //   (https://github.com/DeveloperAlly/solana-hack/actions/runs/38240221918/job/114780695574).
    // 30 s leaves headroom as the workbench grows; the axe queue in src/test/axe.ts stops one slow run cascading.
    testTimeout: 30_000,
  },
});
