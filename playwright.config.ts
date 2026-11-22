import { defineConfig, devices } from '@playwright/test';

// Screenshots differ between machines, so the end-to-end tests run inside Playwright's own image,
// locally and in CI alike: `npm run test:e2e` (see docs/development.md). They emulate a reader who
// prefers reduced motion, so the art shows its resting frame and screenshots hold still; a test
// that wants the art to move asks for motion itself.
export default defineConfig({
  testDir: 'tests/e2e',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  use: { baseURL: 'http://localhost:4321', reducedMotion: 'reduce' },
  webServer: { command: 'npm run preview', url: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } } },
  ],
});
