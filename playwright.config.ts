import { defineConfig, devices } from "@playwright/test";

// Roda contra os emuladores, nunca contra produção: use `npm run test:e2e`.
// Porta exclusiva e sem reaproveitar servidor: um `npm run dev` aberto aponta para produção.
const PORTA = 5199;

export default defineConfig({
  testDir: "./e2e",
  // A máquina do CI é mais lenta e também roda o emulador de funções: mais folga lá.
  // Teste novo deve passar aqui com o padrão; CPU_LENTA=2 imita o CI.
  timeout: process.env.CI ? 120_000 : 60_000,
  // A primeira página compila sob demanda no servidor de desenvolvimento.
  expect: { timeout: process.env.CI ? 20_000 : 10_000 },
  fullyParallel: false,
  workers: 1,
  // No CI, o relatório "github" põe cada falha nas anotações do run, legíveis sem baixar o log.
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    ...devices["Pixel 7"],
    baseURL: `http://localhost:${PORTA}`,
    actionTimeout: process.env.CI ? 20_000 : 10_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx vite --mode emulador --port ${PORTA} --strictPort`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
