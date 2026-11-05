import { expect, test, type Page } from "@playwright/test";

const SENHA = "senha-de-teste";
const FIRESTORE = "http://127.0.0.1:8080/v1/projects/demo-diario/databases/(default)/documents";

const DOMINIOS_REAIS = new Set([
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firestore.googleapis.com",
  "www.googleapis.com",
]);

test.beforeEach(async ({ context }) => {
  await context.route(
    (url) => DOMINIOS_REAIS.has(url.hostname),
    (rota) => rota.abort("blockedbyclient"),
  );
});

async function criarContaETreino(page: Page) {
  const email = `pwa-${Date.now()}@exemplo.com`;
  await page.goto("/entrar");
  await page.getByRole("tab", { name: "Cadastrar" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(SENHA);
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await page.getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();

  await page.goto("/meus-treinos/criar");
  await page.getByPlaceholder("Ex: Peito e Tríceps").fill("Treino offline");
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await page.getByPlaceholder("Buscar exercício...").fill("Supino Inclinado com Halteres");
  await page.getByRole("button", { name: "Adicionar Supino Inclinado com Halteres", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: "Treino offline" })).toBeVisible();
}

async function aguardarServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  // Só controla a página depois de uma recarga.
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
}

test("instalável: manifesto completo e ícones existentes", async ({ page }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifesto = await (await page.request.get(href as string)).json();
  expect(manifesto).toMatchObject({
    name: "Diário de Academia",
    display: "standalone",
    start_url: "/",
    lang: "pt-BR",
  });
  const finalidades = manifesto.icons.map((i: { purpose?: string }) => i.purpose);
  expect(finalidades).toContain("maskable");
  for (const icone of manifesto.icons) {
    expect((await page.request.get(`/${icone.src}`)).ok(), icone.src).toBe(true);
  }
});

test("as fotos não são baixadas de antemão", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  const nomes = await page.evaluate(async () => {
    const todos: string[] = [];
    for (const chave of await caches.keys()) {
      for (const pedido of await (await caches.open(chave)).keys()) todos.push(pedido.url);
    }
    return todos;
  });
  expect(nomes.length).toBeGreaterThan(5);
  expect(nomes.filter((u) => u.includes("/exercises-img/"))).toEqual([]);
});

test("abre, treina e finaliza sem internet, e sincroniza ao voltar", async ({ page, context, request }) => {
  await criarContaETreino(page);
  await aguardarServiceWorker(page);

  // A foto vista com internet fica disponível sem internet.
  await page.goto("/meus-treinos");
  await page.getByRole("button", { name: "Iniciar" }).click();
  const miniatura = page.locator('img[src*="/exercises-img/"]').first();
  await expect.poll(() => miniatura.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Descartar treino" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Descartar" }).click();
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();

  await context.setOffline(true);

  // O app abre do zero, ainda logado.
  await page.goto("/meus-treinos");
  await expect(page.getByRole("heading", { name: "Treino offline" })).toBeVisible();

  await page.getByRole("button", { name: "Iniciar" }).click();
  const fotoOffline = page.locator('img[src*="/exercises-img/"]').first();
  await expect.poll(() => fotoOffline.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

  await page.getByLabel("Peso da série 1 em kg").fill("30");
  await page.getByRole("button", { name: "Concluir série 1", exact: true }).click();

  // Recarregar sem internet não perde a série.
  await page.reload();
  await expect(page.getByRole("button", { name: "Desfazer série 1", exact: true })).toBeVisible();
  await expect(page.getByLabel("Peso da série 1 em kg")).toHaveValue("30");

  await page.getByRole("button", { name: "Finalizar", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Finalizar" }).click();
  await expect(page.getByText("Treino concluído")).toBeVisible();
  await expect(page.getByText("300 kg")).toBeVisible();

  await context.setOffline(false);

  // O treino feito sem internet chega ao servidor.
  await expect(async () => {
    const usuarios = await request.get(`${FIRESTORE}/users?pageSize=100&showMissing=true`, {
      headers: { Authorization: "Bearer owner" },
    });
    const { documents = [] } = (await usuarios.json()) as { documents?: Array<{ name: string }> };
    let total = 0;
    for (const { name } of documents) {
      const id = name.split("/").pop();
      const sessoes = await request.get(`${FIRESTORE}/users/${id}/sessions`, {
        headers: { Authorization: "Bearer owner" },
      });
      const corpo = (await sessoes.json()) as { documents?: Array<{ fields: { nome: { stringValue: string } } }> };
      total += (corpo.documents ?? []).filter((d) => d.fields.nome.stringValue === "Treino offline").length;
    }
    expect(total).toBe(1);
  }).toPass({ timeout: 30_000 });
});
