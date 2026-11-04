import { defineConfig, devices } from "@playwright/test";

// Roda contra os emuladores, nunca contra produção: use `npm run test:e2e`.
// Porta exclusiva e sem reaproveitar servidor: um `npm run dev` aberto aponta para produção.
const PORTA = 5199;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  // A primeira página compila sob demanda no servidor de desenvolvimento.
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Pixel 7"],
    baseURL: `http://localhost:${PORTA}`,
    actionTimeout: 10_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite --mode emulador --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
