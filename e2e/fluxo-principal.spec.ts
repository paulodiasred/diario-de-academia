import { expect, test, type Page } from "@playwright/test";

async function criarConta(page: Page) {
  const email = `teste-${Date.now()}@exemplo.com`;
  await page.goto("/");
  await page.getByRole("tab", { name: "Cadastrar" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill("senha-de-teste");
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  return email;
}

async function criarTreinoSemDescricao(page: Page) {
  await page.goto("/meus-treinos/criar");
  await page.getByPlaceholder("Ex: Peito e Tríceps").fill("Treino de teste");
  await page.getByRole("button", { name: "Abrir catálogo" }).click();
  await page.getByPlaceholder("Buscar exercício...").fill("Abdominal 3/4");
  await page.getByRole("button", { name: "Adicionar Abdominal 3/4" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Treino criado!")).toBeVisible();
}

async function abrirExercicio(page: Page) {
  await expect(page.getByRole("heading", { name: "Treino de teste" })).toBeVisible();
  await page.getByRole("button", { name: "Iniciar" }).click();
  await page.getByRole("heading", { name: "Abdominal 3/4" }).click();
  await expect(page.getByLabel("Peso atual (kg)")).toBeVisible();
}

const serie = (page: Page, numero: number) =>
  page.getByRole("button", { name: new RegExp(`Série\\s*${numero}`) });

test("cria treino sem descrição, registra série e mantém após recarregar", async ({ page }) => {
  await criarConta(page);
  await criarTreinoSemDescricao(page);
  await abrirExercicio(page);

  await page.getByLabel("Peso atual (kg)").fill("20");
  await serie(page, 1).click();
  await expect(serie(page, 1)).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await page.getByRole("heading", { name: "Abdominal 3/4" }).click();
  await expect(serie(page, 1)).toHaveAttribute("aria-pressed", "true");
  await expect(serie(page, 2)).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByLabel("Peso atual (kg)")).toHaveValue("20");
});

test("registra série sem conexão e sincroniza ao voltar (B5)", async ({ page, context }) => {
  await criarConta(page);
  await criarTreinoSemDescricao(page);
  await abrirExercicio(page);
  await page.getByLabel("Peso atual (kg)").fill("25");

  await context.setOffline(true);
  await serie(page, 1).click();
  await expect(serie(page, 1)).toHaveAttribute("aria-pressed", "true");

  await context.setOffline(false);
  await expect(async () => {
    await page.reload();
    await page.getByRole("heading", { name: "Abdominal 3/4" }).click({ timeout: 5_000 });
    await expect(serie(page, 1)).toHaveAttribute("aria-pressed", "true", { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
});

test("exercício concluído pode ser reaberto e corrigido (B8)", async ({ page }) => {
  await criarConta(page);
  await criarTreinoSemDescricao(page);
  await abrirExercicio(page);
  await page.getByLabel("Peso atual (kg)").fill("20");

  for (const numero of [1, 2, 3]) {
    await serie(page, numero).click();
    await expect(serie(page, numero)).toHaveAttribute("aria-pressed", "true");
  }

  // Volta sozinho à lista ao concluir, e o card mostra o estado concluído.
  await expect(page.getByText("Concluído hoje")).toBeVisible();

  // Reabre: continua na tela, sem ser expulso, e consegue desmarcar.
  await page.getByRole("heading", { name: "Abdominal 3/4" }).click();
  await serie(page, 3).click();
  await expect(serie(page, 3)).toHaveAttribute("aria-pressed", "false");
});

test("sair limpa a sessão, e o login devolve os dados", async ({ page }) => {
  const email = await criarConta(page);
  await criarTreinoSemDescricao(page);
  await expect(page.getByRole("heading", { name: "Treino de teste" })).toBeVisible();

  await page.getByRole("button", { name: "Início" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page.locator("#signin-email")).toBeVisible();

  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();

  await page.goto("/meus-treinos");
  await expect(page.getByRole("heading", { name: "Treino de teste" })).toBeVisible();
});

test("senha errada mostra mensagem em português", async ({ page }) => {
  await page.goto("/");
  await page.locator("#signin-email").fill("ninguem@exemplo.com");
  await page.locator("#signin-password").fill("senha-errada");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();
});

test("celular: páginas principais não têm rolagem horizontal", async ({ page }) => {
  await criarConta(page);
  const paginas = [
    { rota: "/", titulo: /Boa|Bom dia/ },
    { rota: "/meus-treinos", titulo: "Meus Treinos" },
    { rota: "/meus-treinos/criar", titulo: "Novo treino" },
  ];
  for (const { rota, titulo } of paginas) {
    await page.goto(rota);
    // Não usar "networkidle": o Firestore mantém uma conexão sempre aberta.
    await expect(page.getByRole("heading", { name: titulo, level: 1 })).toBeVisible();
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(sobra, `rolagem horizontal em ${rota}`).toBeLessThanOrEqual(0);
  }
});
