import { defineConfig, devices } from "@playwright/test";

// O service worker só existe no build: este teste roda no build, contra os emuladores.
// Use `npm run test:pwa`.
const PORTA = 5198;

export default defineConfig({
  testDir: "./e2e-pwa",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    baseURL: `http://localhost:${PORTA}`,
    actionTimeout: 15_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite build --mode emulador --outDir dist-pwa && npx vite preview --mode emulador --outDir dist-pwa --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 240_000,
  },
});
