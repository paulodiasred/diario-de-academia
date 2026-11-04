import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const SENHA = "senha-de-teste";
const FIRESTORE = "http://127.0.0.1:8080/v1/projects/demo-diario/databases/(default)/documents";
const COMO_ADMIN = { Authorization: "Bearer owner" };

const emailNovo = () => `teste-${Date.now()}-${Math.floor(Math.random() * 1e6)}@exemplo.com`;

// Trava de segurança: nenhuma chamada sai para um Firebase real. Compara o domínio, não o
// texto da URL, porque o endereço do emulador também contém "identitytoolkit.googleapis.com".
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

async function criarConta(page: Page) {
  const email = emailNovo();
  await page.goto("/");
  await page.getByRole("tab", { name: "Cadastrar" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(SENHA);
  await page.getByRole("button", { name: "Criar Conta" }).click();
  await page.getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  return email;
}

async function entrar(page: Page, email: string) {
  await page.goto("/");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(SENHA);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

async function adicionarDoCatalogo(page: Page, nome: string) {
  await page.getByPlaceholder("Buscar exercício...").fill(nome);
  await page.getByRole("button", { name: `Adicionar ${nome}`, exact: true }).click();
}

async function criarTreino(page: Page, nome = "Treino de teste", exercicios = ["Supino Inclinado com Halteres"]) {
  await page.goto("/meus-treinos/criar");
  await page.getByPlaceholder("Ex: Peito e Tríceps").fill(nome);
  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  for (const exercicio of exercicios) await adicionarDoCatalogo(page, exercicio);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByRole("heading", { name: nome })).toBeVisible();
}

async function iniciar(page: Page, nome = "Treino de teste") {
  await page
    .locator(".glass-card", { has: page.getByRole("heading", { name: nome, exact: true }) })
    .getByRole("button", { name: "Iniciar" })
    .click();
  await expect(page).toHaveURL(/\/treino$/);
}

const peso = (page: Page, n: number) => page.getByLabel(`Peso da série ${n} em kg`);
const reps = (page: Page, n: number) => page.getByLabel(`Repetições da série ${n}`);

/** Um único toque na série. */
async function concluir(page: Page, n: number) {
  await page.getByRole("button", { name: `Concluir série ${n}`, exact: true }).click();
  await expect(page.getByRole("button", { name: `Desfazer série ${n}`, exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
}

async function finalizar(page: Page) {
  await page.getByRole("button", { name: "Finalizar", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Finalizar" }).click();
  await expect(page.getByText("Treino concluído")).toBeVisible();
}

test.describe("gestão de treinos", () => {
  test("cria treino sem descrição (B1)", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Treino de teste" })).toBeVisible();
  });

  test("reordena, configura e duplica, mantendo tudo após recarregar", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Ordem", ["Abdominal 3/4", "Supino Inclinado com Halteres"]);

    await page.getByRole("button", { name: "Editar Ordem" }).click();
    await page.getByRole("button", { name: "Subir Supino Inclinado com Halteres" }).click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("button", { name: "Editar Ordem" })).toBeVisible();

    await page.getByRole("button", { name: "Duplicar Ordem" }).click();
    await expect(page.getByRole("heading", { name: "Ordem (cópia)" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Ordem (cópia)" })).toBeVisible();
    await iniciar(page, "Ordem");
    await expect(page.getByRole("heading", { name: "Supino Inclinado com Halteres" })).toBeVisible();
  });

  test("biblioteca: busca sem acento e exercício próprio", async ({ page }) => {
    await criarConta(page);
    await page.goto("/exercicios");
    await page.getByPlaceholder("Buscar exercício...").fill("elevacao");
    await expect(page.getByRole("button", { name: /Elevação/ }).first()).toBeVisible();

    await page.getByRole("button", { name: "Criar", exact: true }).click();
    await page.getByLabel("Nome").fill("Meu Exercício Único");
    await page.getByLabel("Músculo principal").selectOption("chest");
    await page.getByRole("button", { name: "Salvar exercício" }).click();

    await page.reload();
    await page.getByPlaceholder("Buscar exercício...").fill("meu exercicio unico");
    await page.getByRole("button", { name: /Meu Exercício Único/ }).click();
    await expect(page.getByRole("button", { name: "Editar" })).toBeVisible();
  });
});

test.describe("treino em andamento", () => {
  test("segunda série com um toque: valores repassados e descanso automático", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);

    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await expect(page.getByRole("timer")).toBeVisible();

    await expect(peso(page, 2)).toHaveValue("20");
    await expect(reps(page, 2)).toHaveValue("10");
    await concluir(page, 2);
  });

  test("peso corporal: conclui com um toque, sem exigir carga", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Corporal", ["Abdominal 3/4"]);
    await iniciar(page, "Corporal");
    await expect(page.getByLabel("Carga extra da série 1 em kg")).toHaveValue("");
    await expect(reps(page, 1)).toHaveValue("10");
    await concluir(page, 1);
  });

  test("FECHAR O NAVEGADOR no meio do treino não perde nada", async ({ page, context }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("32.5");
    await concluir(page, 1);
    await page.getByRole("button", { name: "Adicionar observação" }).click();
    await page.getByLabel("Observações de Supino Inclinado com Halteres").fill("Pegada fechada");
    await peso(page, 2).fill("35");

    // Fecha logo depois de digitar, antes do envio agrupado para a nuvem.
    await page.close();

    const nova = await context.newPage();
    await nova.goto("/");
    await nova.getByRole("button", { name: /Continuar Treino de teste/ }).click();

    await expect(nova.getByRole("button", { name: "Desfazer série 1", exact: true })).toBeVisible();
    await expect(peso(nova, 1)).toHaveValue("32.5");
    await expect(peso(nova, 2)).toHaveValue("35");
    await expect(nova.getByLabel("Observações de Supino Inclinado com Halteres")).toHaveValue("Pegada fechada");
    await expect(nova.getByRole("timer")).toBeVisible();
  });

  test("recupera o treino em outro aparelho, pela nuvem (B7)", async ({ browser, page }) => {
    const email = await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("40");
    await concluir(page, 1);
    await expect(async () => {
      const outroAparelho = await browser.newContext();
      const outra = await outroAparelho.newPage();
      try {
        await entrar(outra, email);
        await outra.getByRole("button", { name: /Continuar Treino de teste/ }).click({ timeout: 5_000 });
        await expect(peso(outra, 1)).toHaveValue("40", { timeout: 2_000 });
      } finally {
        await outroAparelho.close();
      }
    }).toPass({ timeout: 40_000 });
  });

  test("timer: mais tempo, pausa que preserva e pular (B6)", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);

    await page.getByRole("button", { name: "Mais 15 segundos" }).click();
    await expect(page.getByRole("timer")).toHaveText(/1:[0-1]\d/);

    await page.getByRole("button", { name: "Pausar descanso" }).click();
    const pausado = await page.getByRole("timer").textContent();
    await page.waitForTimeout(1_500);
    await expect(page.getByRole("timer")).toHaveText(pausado as string);

    await page.reload();
    await expect(page.getByRole("timer")).toHaveText(pausado as string);

    await page.getByRole("button", { name: "Retomar descanso" }).click();
    await page.getByRole("button", { name: "Pular descanso" }).click();
    await expect(page.getByRole("timer")).toBeHidden();
  });

  test("registra e finaliza sem conexão, e sincroniza ao voltar (B5)", async ({ page, context }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("25");

    await context.setOffline(true);
    await concluir(page, 1);
    await finalizar(page);
    await expect(page.getByText("250 kg")).toBeVisible();

    await context.setOffline(false);
    const url = page.url();
    await expect(async () => {
      await page.goto(url);
      await expect(page.getByText("250 kg")).toBeVisible({ timeout: 3_000 });
    }).toPass({ timeout: 30_000 });
  });

  test("resumo com números reais, último valor recuperado e recorde", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await concluir(page, 2);
    await finalizar(page);
    // 2 séries × 20 kg × 10 repetições; a terceira, não feita, fica de fora.
    await expect(page.getByText("400 kg")).toBeVisible();
    await expect(page.getByText("Novos recordes de carga")).toBeHidden();

    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.goto("/meus-treinos");
    await iniciar(page);
    await expect(peso(page, 1)).toHaveValue("20");
    await expect(page.getByText("Última vez: 20 kg × 10 reps").first()).toBeVisible();

    await peso(page, 1).fill("25");
    await concluir(page, 1);
    await finalizar(page);
    await expect(page.getByText("Novos recordes de carga")).toBeVisible();
    await expect(page.getByText("(antes 20 kg)")).toBeVisible();
  });

  test("a próxima série é a única em destaque, e remover nunca apaga série feita", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    const classe = (n: number) =>
      page.getByRole("button", { name: `Concluir série ${n}`, exact: true }).getAttribute("class");
    await peso(page, 1).fill("20");
    expect(await classe(1)).toContain("bg-primary");
    expect(await classe(2)).not.toContain("bg-primary");
    await concluir(page, 1);
    expect(await classe(2)).toContain("bg-primary");

    const remover = page.getByRole("button", { name: "Remover última série" });
    await remover.click();
    await expect(page.getByRole("button", { name: "Concluir série 3", exact: true })).toBeHidden();
    await concluir(page, 2);
    await expect(remover).toBeDisabled();
  });

  test("abrir um painel não abre o teclado", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    await expect(page.getByPlaceholder("Buscar exercício...")).toBeVisible();
    await expect(page.getByPlaceholder("Buscar exercício...")).not.toBeFocused();
  });

  test("como fazer: imagens e passo a passo sem sair do treino nem parar o descanso", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);

    await page.getByRole("button", { name: "Como fazer" }).click();
    await expect(page.getByText("Como executar")).toBeVisible();
    const imagem = page.getByRole("img", { name: /início do movimento/ });
    await expect(imagem).toBeVisible();
    await expect
      .poll(() => imagem.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("timer")).toBeVisible();
    await expect(page.getByRole("button", { name: "Desfazer série 1", exact: true })).toBeVisible();
  });

  test("descartar pede confirmação e não vai para o histórico", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);

    await page.getByRole("button", { name: "Descartar treino" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Descartar" }).click();

    await expect(page.getByRole("button", { name: /Continuar/ })).toBeHidden();
    await expect(page.getByText("Último treino")).toBeHidden();
  });

  test("não abre um segundo treino por cima do que está em andamento", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Primeiro");
    await criarTreino(page, "Segundo");
    await iniciar(page, "Primeiro");
    await page.goto("/meus-treinos");
    await iniciar(page, "Segundo").catch(() => undefined);
    await expect(page.getByRole("alertdialog")).toContainText("Primeiro");
  });
});

test.describe("dados antigos", () => {
  async function semearContaAntiga(request: APIRequestContext) {
    const email = emailNovo();
    const conta = await request.post(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
      { data: { email, password: SENHA, returnSecureToken: true } },
    );
    const uid = (await conta.json()).localId as string;
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const [serie, peso] of [[1, 60], [2, 62.5]]) {
      await request.post(`${FIRESTORE}/registros`, {
        headers: COMO_ADMIN,
        data: {
          fields: {
            userId: { stringValue: uid },
            exercicio: { stringValue: "Supino barra" },
            peso: { doubleValue: peso },
            serie: { integerValue: serie },
            dia: { stringValue: "Segunda" },
            concluida: { booleanValue: true },
            data: { timestampValue: ontem },
          },
        },
      });
    }
    return { email, uid };
  }

  async function contar(request: APIRequestContext, caminho: string, uid?: string) {
    const resposta = await request.get(`${FIRESTORE}/${caminho}?pageSize=300`, { headers: COMO_ADMIN });
    const { documents = [] } = (await resposta.json()) as {
      documents?: Array<{ fields: { userId?: { stringValue: string } } }>;
    };
    return uid ? documents.filter((d) => d.fields.userId?.stringValue === uid).length : documents.length;
  }

  test("migra sem apagar nada, sem duplicar e sem inventar repetições", async ({ page, request }) => {
    const { email, uid } = await semearContaAntiga(request);
    await entrar(page, email);

    // O treino fixo virou rotinas da conta.
    await page.goto("/meus-treinos");
    await expect(page.getByRole("heading", { name: "Segunda", exact: true })).toBeVisible();

    // A carga antiga é recuperada; as repetições antigas não existem e não são inventadas.
    await iniciar(page, "Segunda");
    await expect(peso(page, 1)).toHaveValue("60");
    await expect(peso(page, 2)).toHaveValue("62.5");
    await expect(reps(page, 1)).toHaveValue("");
    await page.getByRole("button", { name: "Concluir série 1", exact: true }).click();
    await expect(page.getByText("Informe as repetições desta série")).toBeVisible();

    // Os registros originais continuam intactos.
    expect(await contar(request, "registros", uid)).toBe(2);
    expect(await contar(request, `users/${uid}/sessions`)).toBe(1);

    // Entrar de novo não duplica nada.
    await page.reload();
    await expect(peso(page, 1)).toHaveValue("60");
    expect(await contar(request, "registros", uid)).toBe(2);
    expect(await contar(request, `users/${uid}/sessions`)).toBe(1);
  });

  test("como fazer: exercício antigo sugere parecidos, sem ligar sozinho", async ({ page, request }) => {
    const { email } = await semearContaAntiga(request);
    await entrar(page, email);
    await page.goto("/meus-treinos");
    await iniciar(page, "Segunda");

    await page.getByRole("button", { name: "Como fazer" }).click();
    await expect(page.getByText(/não está ligado ao catálogo/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: /Supino/ }).first().click();
    await expect(page.getByText("Como executar")).toBeVisible();
    await expect(page.getByText(/Confira se é o mesmo movimento/)).toBeVisible();
  });

  test("como fazer: a escolha fica salva, com foto, e pode ser trocada", async ({ page, request }) => {
    const { email } = await semearContaAntiga(request);
    await entrar(page, email);
    await page.goto("/meus-treinos");
    await iniciar(page, "Segunda");

    await page.getByRole("button", { name: "Como fazer" }).click();
    await page.getByRole("dialog").getByRole("button", { name: /Supino/ }).first().click();
    await page.getByRole("button", { name: "Usar sempre este" }).click();
    await expect(page.getByText(/Referência que você escolheu/)).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Como fazer" }).click();
    await expect(page.getByText(/Referência que você escolheu/)).toBeVisible();
    await expect(page.getByText(/não está ligado ao catálogo/)).toBeHidden();
    const imagem = page.getByRole("img", { name: /início do movimento/ });
    await expect
      .poll(() => imagem.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Trocar referência" }).click();
    await expect(page.getByText(/Escolha outra referência/)).toBeVisible();
  });


  test("contas diferentes migram sem colidir", async ({ browser, request }) => {
    for (let i = 0; i < 2; i++) {
      const { email } = await semearContaAntiga(request);
      const contexto = await browser.newContext();
      const pagina = await contexto.newPage();
      await entrar(pagina, email);
      await pagina.goto("/meus-treinos");
      await expect(pagina.getByRole("heading", { name: "Segunda", exact: true })).toBeVisible();
      await contexto.close();
    }
  });

  test("a evolução avisa o que os registros antigos não têm, sem inventar", async ({ page, request }) => {
    const { email } = await semearContaAntiga(request);
    await entrar(page, email);
    await page.goto("/evolucao");

    const periodo = page.getByRole("region", { name: "Comparação entre períodos" });
    await expect(periodo).toContainText("2 séries fora do volume");
    await expect(periodo).toContainText("1 treino fora do tempo");
    await expect(periodo.getByText("0 kg")).toBeVisible();

    await page.getByRole("button", { name: /Supino barra/ }).click();
    await expect(page.getByText("62,5 kg", { exact: true })).toBeVisible();
  });

  test("conta nova não vê o treino fixo de ninguém", async ({ page }) => {
    await criarConta(page);
    await expect(page.getByText("Monte seu primeiro treino")).toBeVisible();
    await page.goto("/meus-treinos");
    await expect(page.getByRole("heading", { name: "Segunda", exact: true })).toBeHidden();
    await expect(page.getByText("Você ainda não tem treinos salvos.")).toBeVisible();
  });
});

test.describe("dashboard e evolução", () => {
  async function treinarEFinalizar(page: Page, carga: string) {
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill(carga);
    await concluir(page, 1);
    await concluir(page, 2);
    await finalizar(page);
  }

  test("sem treinos, a evolução orienta em vez de mostrar zeros", async ({ page }) => {
    await criarConta(page);
    await page.goto("/evolucao");
    await expect(page.getByText("Sua evolução começa no primeiro treino")).toBeVisible();
  });

  test("os números vêm do treino real, de ponta a ponta", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await treinarEFinalizar(page, "20");

    await page.goto("/evolucao");
    const periodo = page.getByRole("region", { name: "Comparação entre períodos" });
    // 2 séries × 20 kg × 10 repetições.
    await expect(periodo.getByText("400 kg")).toBeVisible();

    // Sem período anterior, não há porcentagem inventada.
    await expect(periodo.getByText("vs. anterior")).toHaveCount(0);

    await page.getByRole("button", { name: /Supino Inclinado com Halteres/ }).click();
    await expect(page.getByRole("heading", { name: "Supino Inclinado com Halteres" })).toBeVisible();
    await expect(page.getByText("20 kg", { exact: true })).toBeVisible();
    await expect(page.getByText("Registre pelo menos dois treinos")).toBeVisible();
  });

  test("calendário marca o dia e abre o treino; recorde aparece no painel", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await treinarEFinalizar(page, "20");
    await treinarEFinalizar(page, "25");

    await page.goto("/");
    await expect(page.getByRole("region", { name: "Recordes recentes" })).toContainText("25 kg");

    await page.goto("/evolucao");
    const hoje = new Date().toLocaleDateString("pt-BR");
    await page.getByRole("button", { name: new RegExp(`^${hoje}: Treino de teste`) }).click();
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page).toHaveURL(/\/evolucao$/);
  });

  test("meta semanal: começa vazia, é definida e sobrevive à recarga", async ({ page }) => {
    await criarConta(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Definir meta" }).click();
    await page.getByRole("button", { name: "3 treinos por semana" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("progressbar", { name: "Meta semanal" })).toBeVisible();

    await page.reload();
    await expect(page.getByText("0 de 3")).toBeVisible();
  });

  test("próximo treino mostra o programado para hoje", async ({ page }) => {
    const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByPlaceholder("Ex: Peito e Tríceps").fill("De hoje");
    await page.getByRole("button", { name: dias[new Date().getDay()], exact: true }).click();
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    await adicionarDoCatalogo(page, "Supino Inclinado com Halteres");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "De hoje" })).toBeVisible();

    await page.getByRole("button", { name: "Início" }).click();
    await expect(page.getByRole("region", { name: "Próximo treino" })).toContainText("Hoje");
    await expect(page.getByRole("region", { name: "Próximo treino" })).toContainText("De hoje");
  });

  test("tema claro é aplicado e lembrado", async ({ page }) => {
    await criarConta(page);
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Ajustes" }).click();
    await page.getByRole("button", { name: "Claro" }).click();
    await expect(page.locator("html")).toHaveClass(/light/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/light/);
  });
});

test.describe("planos, metas e dados", () => {
  async function contaPorApi(request: APIRequestContext) {
    const email = emailNovo();
    const conta = await request.post(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
      { data: { email, password: SENHA, returnSecureToken: true } },
    );
    return { email, uid: (await conta.json()).localId as string };
  }

  async function gravarComoAdmin(request: APIRequestContext, caminho: string, fields: object) {
    const resposta = await request.patch(`${FIRESTORE}/${caminho}`, {
      headers: COMO_ADMIN,
      data: { fields },
    });
    expect(resposta.ok()).toBe(true);
  }

  const virarPremium = (request: APIRequestContext, uid: string) =>
    gravarComoAdmin(request, `entitlements/${uid}`, { plano: { stringValue: "premium" } });

  test("onboarding: define a meta e leva a criar o primeiro treino", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Cadastrar" }).click();
    await page.locator("#signup-email").fill(emailNovo());
    await page.locator("#signup-password").fill(SENHA);
    await page.getByRole("button", { name: "Criar Conta" }).click();

    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "4 treinos por semana" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Criar meu primeiro treino" }).click();
    await expect(page).toHaveURL(/\/meus-treinos\/criar$/);

    await page.goto("/");
    await expect(page.getByText("0 de 4")).toBeVisible();
  });

  test("onboarding não aparece para quem só entrou", async ({ page, request }) => {
    const { email } = await contaPorApi(request);
    await entrar(page, email);
    await expect(page.getByRole("button", { name: "Pular" })).toBeHidden();
  });

  test("no limite do gratuito, criar leva aos planos", async ({ page, request }) => {
    const { email, uid } = await contaPorApi(request);
    await gravarComoAdmin(request, `users/${uid}/uso/contadores`, { treinos: { integerValue: 4 } });
    await entrar(page, email);
    await page.goto("/meus-treinos");
    await expect(page.getByText(/Você usou os 4 treinos/)).toBeVisible();
    await page.getByRole("button", { name: "Criar novo treino" }).click();
    await expect(page).toHaveURL(/\/planos$/);
    await expect(page.getByText("Seu plano: Gratuito")).toBeVisible();
    await expect(page.getByText(/não está à venda/)).toBeVisible();
  });

  test("criar conta o treino, e excluir devolve a vaga", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await expect(page.getByText("1 de 4 treinos")).toBeVisible();
    await page.reload();
    await expect(page.getByText("1 de 4 treinos")).toBeVisible();

    await page.getByRole("button", { name: "Excluir Treino de teste" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir" }).click();
    await expect(page.getByText("0 de 4 treinos")).toBeVisible();
    await page.reload();
    await expect(page.getByText("0 de 4 treinos")).toBeVisible();
  });

  test("gratuito vê o que é Premium bloqueado, sem dados falsos", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await finalizar(page);

    await page.goto("/evolucao");
    await expect(page.getByRole("heading", { name: "Metas personalizadas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova meta" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Conquistas" })).toContainText("Primeiro treino");
    await expect(page.getByRole("region", { name: "Conquistas" })).toContainText("Mais 6 conquistas no Premium");

    await page.getByRole("button", { name: /30 dias/ }).click();
    await expect(page).toHaveURL(/\/planos$/);
  });

  test("Premium concedido no servidor libera tudo, e meta acompanha o progresso", async ({ page, request }) => {
    const { email, uid } = await contaPorApi(request);
    await virarPremium(request, uid);
    await entrar(page, email);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await expect(page.getByText(/treinos do plano gratuito/)).toBeHidden();
    await iniciar(page);
    await peso(page, 1).fill("80");
    await concluir(page, 1);
    await finalizar(page);

    await page.goto("/evolucao");
    await page.getByRole("button", { name: "30 dias" }).click();
    await expect(page.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "Volume por semana" })).toBeVisible();

    await page.getByRole("button", { name: "Nova meta" }).click();
    await page.getByLabel("Exercício", { exact: true }).selectOption("Supino Inclinado com Halteres");
    await page.getByLabel(/Alvo/).fill("100");
    await page.getByRole("button", { name: "Salvar meta" }).click();
    await expect(page.getByText("80 de 100 kg")).toBeVisible();

    await page.reload();
    await expect(page.getByText("80 de 100 kg")).toBeVisible();

    await page.goto("/conta");
    await expect(page.getByRole("button", { name: "Relatório por exercício (CSV)" })).toBeVisible();
  });

  test("exporta histórico e todos os dados, no plano gratuito", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill("62.5");
    await concluir(page, 1);
    await finalizar(page);

    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.goto("/conta");

    const ler = async (nome: RegExp) => {
      const [arquivo] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: nome }).click(),
      ]);
      return { nome: arquivo.suggestedFilename(), caminho: await arquivo.path() };
    };
    const { readFileSync } = await import("node:fs");

    const csv = await ler(/Histórico em planilha/);
    expect(csv.nome).toMatch(/^historico-.*\.csv$/);
    expect(readFileSync(csv.caminho, "utf8")).toContain("Supino Inclinado com Halteres;1;62,5;10");

    const json = await ler(/Todos os dados/);
    const dados = JSON.parse(readFileSync(json.caminho, "utf8"));
    expect(dados.sessoes).toHaveLength(1);
    expect(dados.treinos).toHaveLength(1);
  });

  test("compartilhar copia o resumo quando não há compartilhamento nativo", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "share", { value: undefined });
    });
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await finalizar(page);

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByText("Resumo copiado")).toBeVisible();
    const texto = await page.evaluate(() => navigator.clipboard.readText());
    expect(texto).toContain("Treino concluído: Treino de teste");
    expect(texto).toContain("200 kg");
  });

  test("excluir conta: senha errada não apaga nada; a certa apaga tudo", async ({ page, request }) => {
    const email = await criarConta(page);
    await criarTreino(page);
    await page.goto("/conta");

    await page.getByRole("button", { name: "Excluir minha conta" }).click();
    const excluir = page.getByRole("button", { name: "Excluir para sempre" });
    await expect(excluir).toBeDisabled();
    await page.getByLabel("Digite EXCLUIR para confirmar").fill("EXCLUIR");
    await page.getByLabel("Sua senha").fill("senha-errada");
    await excluir.click();
    await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();

    const contarDoUsuario = async () => {
      const r = await request.get(`${FIRESTORE}/treinos?pageSize=300`, { headers: COMO_ADMIN });
      const { documents = [] } = (await r.json()) as { documents?: Array<{ name: string }> };
      return documents.length;
    };
    const antes = await contarDoUsuario();
    expect(antes).toBeGreaterThan(0);

    await page.getByLabel("Sua senha").fill(SENHA);
    await excluir.click();
    await expect(page.locator("#signin-email")).toBeVisible();
    expect(await contarDoUsuario()).toBe(antes - 1);

    await page.locator("#signin-email").fill(email);
    await page.locator("#signin-password").fill(SENHA);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();
  });
});

test.describe("conta", () => {
  test("sair limpa o aparelho, e o login devolve os dados", async ({ page }) => {
    const email = await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);

    await page.goto("/");
    await page.getByRole("button", { name: "Sair" }).click();
    await expect(page.locator("#signin-email")).toBeVisible();
    // O logout recarrega a página: repete até a leitura pegar a página nova.
    await expect(async () => {
      const rascunhos = await page.evaluate(() =>
        Object.keys(localStorage).filter((c) => c.startsWith("diario:")),
      );
      expect(rascunhos).toEqual([]);
    }).toPass({ timeout: 15_000 });
    await expect(page.locator("#signin-email")).toBeVisible();

    await entrar(page, email);
    await page.getByRole("button", { name: /Continuar Treino de teste/ }).click();
    await expect(peso(page, 1)).toHaveValue("20");
  });

  test("a saudação nunca usa o email como nome", async ({ page }) => {
    await criarConta(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^(Bom dia|Boa tarde|Boa noite)!$/);
  });

  test("senha errada mostra mensagem em português", async ({ page }) => {
    await page.goto("/");
    await page.locator("#signin-email").fill("ninguem@exemplo.com");
    await page.locator("#signin-password").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByText("Email ou senha incorretos.")).toBeVisible();
  });
});

test("celular: nenhuma tela principal tem rolagem horizontal", async ({ page }) => {
  await criarConta(page);
  await criarTreino(page);
  await iniciar(page);
  const paginas = [
    { rota: "/treino", titulo: "Treino de teste" },
    { rota: "/", titulo: /Boa|Bom dia/ },
    { rota: "/meus-treinos", titulo: "Meus Treinos" },
    { rota: "/meus-treinos/criar", titulo: "Novo treino" },
    { rota: "/exercicios", titulo: "Exercícios" },
    { rota: "/evolucao", titulo: "Evolução" },
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
