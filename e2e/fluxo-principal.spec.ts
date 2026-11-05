import AxeBuilder from "@axe-core/playwright";
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
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();
  return email;
}

async function entrar(page: Page, email: string) {
  await page.goto("/");
  await page.locator("#signin-email").fill(email);
  await page.locator("#signin-password").fill(SENHA);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();
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

/** Editar, duplicar e excluir ficam na ficha: o cartão só tem o Iniciar. */
async function acaoDaFicha(page: Page, acao: "Editar" | "Duplicar" | "Excluir", nome: string) {
  await page.getByRole("button", { name: `Detalhes de ${nome}`, exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: `${acao} ${nome}`, exact: true }).click();
}

const abaDaEvolucao = (page: Page, nome: string) => page.getByRole("tab", { name: nome }).click();

const peso = (page: Page, n: number) => page.getByLabel(`Peso da série ${n} em kg`);
const reps = (page: Page, n: number) => page.getByLabel(`Repetições da série ${n}`, { exact: true });

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

    await acaoDaFicha(page, "Editar", "Ordem");
    await page.getByRole("button", { name: "Configurar Supino Inclinado com Halteres" }).click();
    await page.getByRole("button", { name: "Subir Supino Inclinado com Halteres" }).click();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Ordem", exact: true })).toBeVisible();

    await acaoDaFicha(page, "Duplicar", "Ordem");
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

    await abaDaEvolucao(page, "Exercícios");
    await page.getByRole("button", { name: /Supino barra/ }).click();
    await expect(page.getByText("62,5 kg", { exact: true })).toBeVisible();
  });

  test("conta nova não vê o treino fixo de ninguém", async ({ page }) => {
    await criarConta(page);
    await expect(page.getByText("Monte seu primeiro treino")).toBeVisible();
    await page.goto("/meus-treinos");
    await expect(page.getByRole("heading", { name: "Segunda", exact: true })).toBeHidden();
    await expect(page.getByText("Você ainda não tem treinos salvos")).toBeVisible();
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

    await abaDaEvolucao(page, "Exercícios");
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
    await abaDaEvolucao(page, "Histórico");
    const hoje = new Date().toLocaleDateString("pt-BR");
    await page.getByRole("button", { name: new RegExp(`^${hoje}: Treino de teste`) }).click();
    await page.getByRole("button", { name: "Voltar" }).click();
    // Volta para a aba em que a pessoa estava.
    await expect(page).toHaveURL(/\/evolucao\?aba=historico$/);
    await expect(page.getByRole("tab", { name: "Histórico" })).toHaveAttribute("aria-selected", "true");
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
    await page.getByRole("button", { name: "Montar minha ficha" }).click();
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

    await acaoDaFicha(page, "Excluir", "Treino de teste");
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
    await expect(page.getByRole("heading", { name: "Volume por semana" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Séries por grupo muscular" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Séries por grupo muscular" })).toHaveCount(0);
    await abaDaEvolucao(page, "Conquistas");
    await expect(page.getByRole("heading", { name: "Metas personalizadas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova meta" })).toBeHidden();
    await expect(page.getByRole("region", { name: "Conquistas" })).toContainText("Primeiro treino");
    await expect(page.getByRole("region", { name: "Conquistas" })).toContainText("Mais 6 conquistas no Premium");

    await abaDaEvolucao(page, "Resumo");
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
    await expect(page.getByRole("region", { name: "Séries por grupo muscular" })).toContainText("Peito");

    await abaDaEvolucao(page, "Conquistas");
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

    await page.goto("/conta");
    await page.getByRole("button", { name: "Sair da conta" }).click();
    // Sair pede confirmação, e cancelar mantém a conta aberta.
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Sair", exact: true }).click();
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

test.describe("confiança nos dados", () => {
  async function treinoFinalizado(page: Page) {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill("20");
    await reps(page, 1).fill("10");
    await concluir(page, 1);
    await finalizar(page);
  }

  test("corrigir um peso no histórico atualiza o resumo e a evolução", async ({ page }) => {
    await treinoFinalizado(page);
    await expect(page.getByText("200 kg")).toBeVisible();

    await page.getByRole("button", { name: "Corrigir" }).click();
    const painel = page.getByRole("dialog");
    await painel.getByLabel("Peso (kg)").fill("30");
    await painel.getByRole("button", { name: "Salvar correção" }).click();
    await expect(page.getByText("Treino corrigido")).toBeVisible();
    await expect(page.getByText("300 kg")).toBeVisible();

    // Vale depois de recarregar: foi gravado, não só alterado na tela.
    await page.reload();
    await expect(page.getByText("300 kg")).toBeVisible();
    await page.goto("/evolucao?aba=exercicios");
    await expect(page.getByText(/melhor carga 30 kg/)).toBeVisible();
  });

  test("correção inválida não é salva, e cancelar não deixa sobra", async ({ page }) => {
    await treinoFinalizado(page);
    await page.getByRole("button", { name: "Corrigir" }).click();
    const painel = page.getByRole("dialog");
    await painel.getByLabel("Repetições").fill("");
    await painel.getByRole("button", { name: "Salvar correção" }).click();
    await expect(page.getByText("Informe as repetições desta série")).toBeVisible();
    await expect(painel.getByLabel("Repetições")).toHaveAttribute("aria-invalid", "true");

    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Corrigir" }).click();
    await expect(page.getByRole("dialog").getByLabel("Repetições")).toHaveValue("10");
  });

  test("excluir treino pede confirmação, some do histórico e pode ser desfeito", async ({ page }) => {
    await treinoFinalizado(page);
    await page.getByRole("button", { name: "Excluir treino" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByText("Treino concluído")).toBeVisible();

    await page.getByRole("button", { name: "Excluir treino" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Treino excluído")).toBeVisible();
    await page.getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByRole("heading", { name: "Último treino" })).toBeVisible();

    await page.getByRole("button", { name: /Treino de teste/ }).click();
    await page.getByRole("button", { name: "Excluir treino" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Treino excluído")).toBeVisible();
    await page.goto("/evolucao");
    await expect(page.getByText("Sua evolução começa no primeiro treino")).toBeVisible();
  });

  test("sair do formulário alterado pede confirmação, e o rascunho sobrevive à recarga", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    // Sem alterações, voltar não pergunta nada.
    await page.getByRole("button", { name: "Voltar" }).click();
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible();

    await page.goto("/meus-treinos/criar");
    const nome = page.getByPlaceholder("Ex: Peito e Tríceps");
    await nome.fill("Treino quase perdido");
    await page.getByRole("button", { name: "Voltar" }).click();
    const dialogo = page.getByRole("alertdialog");
    await dialogo.getByRole("button", { name: "Continuar editando" }).click();
    await expect(nome).toHaveValue("Treino quase perdido");

    // É o que protege o voltar do celular, que não dá para interceptar.
    await page.reload();
    await expect(nome).toHaveValue("Treino quase perdido");
    await expect(page.getByText("Rascunho recuperado")).toBeVisible();

    await page.getByRole("button", { name: "Voltar" }).click();
    await dialogo.getByRole("button", { name: "Sair sem salvar" }).click();
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible();
    await page.goto("/meus-treinos/criar");
    await expect(nome).toHaveValue("");
  });

  test("salvar confirma na tela e limpa o rascunho", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await expect(page.getByText("Treino criado")).toBeVisible();
    const rascunhos = await page.evaluate(() =>
      Object.keys(localStorage).filter((c) => c.startsWith("diario:treino-em-edicao:")),
    );
    expect(rascunhos).toEqual([]);
  });

  test("excluir um treino da lista pode ser desfeito", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await acaoDaFicha(page, "Excluir", "Treino de teste");
    await page.getByRole("alertdialog").getByRole("button", { name: "Excluir", exact: true }).click();
    await expect(page.getByText("Você ainda não tem treinos salvos")).toBeVisible();
    await page.getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByRole("heading", { name: "Treino de teste" })).toBeVisible();
  });

  test("trocar de aba abre a tela nova no topo", async ({ page }) => {
    await criarConta(page);
    await page.goto("/exercicios");
    await expect(page.getByRole("heading", { name: "Exercícios" })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 2000));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);

    await page.getByRole("button", { name: "Treinos", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible();
    await page.getByRole("button", { name: "Exercícios", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Exercícios" })).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("planilha sem treinos avisa em vez de baixar um arquivo vazio", async ({ page }) => {
    await criarConta(page);
    await page.goto("/conta");
    let baixou = false;
    page.on("download", () => {
      baixou = true;
    });
    await page.getByRole("button", { name: /Histórico em planilha/ }).click();
    await expect(page.getByText("Você ainda não tem treinos finalizados para exportar.")).toBeVisible();
    expect(baixou).toBe(false);
  });

  test("o eixo do gráfico não corta os números", async ({ page }) => {
    await treinoFinalizado(page);
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await page.goto("/evolucao");
    await expect(page.getByRole("heading", { name: "Volume por semana" })).toBeVisible();
    await page.waitForSelector(".recharts-yAxis text");
    const cortados = await page.evaluate(() =>
      [...document.querySelectorAll(".recharts-yAxis text")]
        .filter((t) => {
          const svg = (t as SVGTextElement).ownerSVGElement as SVGSVGElement;
          return t.getBoundingClientRect().left < svg.getBoundingClientRect().left;
        })
        .map((t) => t.textContent),
    );
    expect(cortados).toEqual([]);
  });
});

test.describe("primeiro treino", () => {
  const LISTA = (page: Page) => page.getByRole("dialog");

  test("do onboarding ao treino em 3 toques, com um modelo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Cadastrar" }).click();
    await page.locator("#signup-email").fill(emailNovo());
    await page.locator("#signup-password").fill(SENHA);
    await page.getByRole("button", { name: "Criar Conta" }).click();
    await page.getByRole("button", { name: "Começar" }).click();
    await page.getByRole("button", { name: "3 treinos por semana" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();

    await page.getByRole("button", { name: "Escolher um modelo pronto" }).click();
    await page.getByRole("button", { name: /^ABC(?!D)/ }).click();
    await page.getByRole("button", { name: "Usar este modelo" }).click();

    await expect(page.getByRole("heading", { name: "Treino A - Peito, ombro e tríceps" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Treino B - Costas e bíceps" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Treino C - Pernas" })).toBeVisible();
    await expect(page.getByText("3 de 4 treinos")).toBeVisible();

    // Foi gravado, conta no plano e dá para treinar.
    await page.reload();
    await expect(page.getByText("3 de 4 treinos")).toBeVisible();
    await iniciar(page, "Treino C - Pernas");
    await expect(page.getByRole("heading", { name: "Agachamento Livre com Barra" })).toBeVisible();
  });

  test("modelo maior que as vagas do plano explica o motivo em vez de falhar", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos/modelos");
    await page.getByRole("button", { name: /^ABCD/ }).click();
    await expect(page.getByText(/tem 4 fichas, e seu plano tem 3 vagas/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Usar este modelo" })).toBeHidden();
  });

  test("a busca entende o nome usado na academia e mostra o básico primeiro", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    const busca = page.getByPlaceholder("Buscar exercício...");
    await busca.fill("");
    // Sem buscar, a lista já abre com o que todo mundo usa.
    await expect(LISTA(page).getByRole("button", { name: /^Adicionar/ }).first()).toHaveAccessibleName(
      "Adicionar Supino Reto com Barra - Pegada Média",
    );

    await busca.fill("peito");
    await expect(LISTA(page).getByRole("button", { name: /^Adicionar/ }).first()).toHaveAccessibleName(/Supino/);

    for (const [termo, nome] of [
      ["cadeira extensora", "Cadeira Extensora"],
      ["voador", "Voador (Peck Deck)"],
      ["puxada frontal", "Puxada Frontal com Pegada Larga"],
      ["burpee", "Burpee"],
    ]) {
      await busca.fill(termo);
      await expect(page.getByRole("button", { name: `Adicionar ${nome}`, exact: true })).toBeVisible();
    }
  });

  test("chips de grupo filtram, e Concluir fecha mostrando quantos foram adicionados", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    const painel = LISTA(page);

    await painel.getByRole("button", { name: "Pernas", exact: true }).click();
    await expect(painel.getByRole("button", { name: "Pernas", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(painel.getByRole("button", { name: /^Adicionar/ }).first()).toHaveAccessibleName(
      "Adicionar Agachamento Livre com Barra",
    );
    await expect(painel.getByRole("button", { name: "Adicionar Corrida na Esteira" })).toBeHidden();

    await expect(painel.getByText("Nenhum exercício adicionado")).toBeVisible();
    await painel.getByRole("button", { name: "Adicionar Agachamento Livre com Barra" }).click();
    await painel.getByRole("button", { name: "Adicionar Leg Press", exact: true }).click();
    await expect(painel.getByText("2 adicionados")).toBeVisible();

    await painel.getByRole("button", { name: "Concluir" }).click();
    await expect(page.getByRole("heading", { name: /Exercícios/ })).toContainText("(2)");
  });

  test("exercícios recolhidos mostram o resumo, e abrir permite configurar", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Recolhido", ["Supino Inclinado com Halteres", "Abdominal 3/4"]);
    await acaoDaFicha(page, "Editar", "Recolhido");

    await expect(page.getByText("3 × 10 · 60s de descanso").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Aumentar séries" })).toBeHidden();

    await page.getByRole("button", { name: "Configurar Supino Inclinado com Halteres" }).click();
    await page.getByRole("button", { name: "Aumentar séries" }).click();
    await expect(page.getByText("4 × 10 · 60s de descanso")).toBeVisible();
  });

  test("arrastar reordena os exercícios", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Arrastar", ["Supino Inclinado com Halteres", "Abdominal 3/4"]);
    await acaoDaFicha(page, "Editar", "Arrastar");

    const nomes = () => page.getByRole("button", { name: /^Configurar/ }).evaluateAll((b) => b.map((x) => x.getAttribute("aria-label")));
    expect(await nomes()).toEqual(["Configurar Supino Inclinado com Halteres", "Configurar Abdominal 3/4"]);

    const alca = page.getByTestId("arrastar-Incline_Dumbbell_Press");
    const caixa = (await alca.boundingBox())!;
    await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2);
    await page.mouse.down();
    for (let passo = 1; passo <= 8; passo++) {
      await page.mouse.move(caixa.x + caixa.width / 2, caixa.y + caixa.height / 2 + passo * 12);
      await page.waitForTimeout(30);
    }
    await page.mouse.up();
    await expect.poll(nomes).toEqual(["Configurar Abdominal 3/4", "Configurar Supino Inclinado com Halteres"]);

    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible();
    await page.reload();
    await iniciar(page, "Arrastar");
    await expect(page.getByRole("heading", { name: "Abdominal 3/4" })).toBeVisible();
  });

  test("salvar incompleto aponta o campo, sem sair da tela", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Salvar" }).click();
    const nome = page.getByPlaceholder("Ex: Peito e Tríceps");
    await expect(page.getByText("Dê um nome ao treino")).toBeVisible();
    await expect(nome).toBeFocused();
    await expect(nome).toHaveAttribute("aria-invalid", "true");

    await nome.fill("Sem exercícios");
    await expect(page.getByText("Dê um nome ao treino")).toBeHidden();
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Adicione pelo menos um exercício")).toBeVisible();
    await expect(page).toHaveURL(/\/meus-treinos\/criar$/);
  });

  test("o botão de salvar fica à vista com a lista longa", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await criarConta(page);
    await criarTreino(page, "Longo", ["Supino Inclinado com Halteres", "Abdominal 3/4", "Leg Press", "Prancha"]);
    await acaoDaFicha(page, "Editar", "Longo");
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole("button", { name: "Salvar" })).toBeInViewport();
  });

  test("com sinal ruim, o catálogo abre o painel antes de terminar de baixar", async ({ page }) => {
    await criarConta(page);
    await page.route(/useCatalogoExercicios|CatalogoDrawer|exercises-ptbr/, async (rota) => {
      await new Promise((r) => setTimeout(r, 2500));
      await rota.continue();
    });
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    await expect(page.getByRole("status", { name: "Carregando exercícios" })).toBeVisible();
    await expect(page.getByPlaceholder("Buscar exercício...")).toBeVisible({ timeout: 15_000 });
  });
});

test.describe("treino com uma mão", () => {
  test("celular pequeno: 3 séries seguidas sem precisar rolar a tela", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await criarConta(page);
    await criarTreino(page, "Pequeno");
    await iniciar(page, "Pequeno");
    await peso(page, 1).fill("20");

    for (const n of [1, 2, 3]) {
      const botao = page.getByRole("button", { name: `Concluir série ${n}`, exact: true });
      const situacao = await botao.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const noCentro = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { naTela: r.top >= 0 && r.bottom <= innerHeight, livre: !!noCentro && el.contains(noCentro) };
      });
      expect(situacao, `série ${n}`).toEqual({ naTela: true, livre: true });
      await botao.click();
      await expect(page.getByRole("button", { name: `Desfazer série ${n}`, exact: true })).toBeVisible();
    }
  });

  test("com mais séries, a próxima aparece sozinha, sem ficar atrás do descanso", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await criarConta(page);
    await criarTreino(page, "Muitas");
    await iniciar(page, "Muitas");
    await peso(page, 1).fill("20");
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Adicionar série" }).click();

    for (const n of [1, 2, 3, 4, 5]) {
      await page.getByRole("button", { name: `Concluir série ${n}`, exact: true }).click();
      const seguinte = page.getByRole("button", { name: `Concluir série ${n + 1}`, exact: true });
      await expect(seguinte).toBeInViewport();
      const livre = await seguinte.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const noCentro = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return !!noCentro && el.contains(noCentro);
      });
      expect(livre, `série ${n + 1} coberta`).toBe(true);
    }
  });

  test("o exercício seguinte abre do topo, e a lista mostra os nomes", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 });
    await criarConta(page);
    await criarTreino(page, "Dois", ["Supino Inclinado com Halteres", "Rosca Martelo"]);
    await iniciar(page, "Dois");
    await expect(page.getByRole("button", { name: /Próximo: Rosca Martelo/ })).toBeVisible();

    await peso(page, 1).fill("20");
    for (const n of [1, 2, 3]) await concluir(page, n).catch(() => undefined);

    await expect(page.getByRole("heading", { name: "Rosca Martelo" })).toBeInViewport();
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    await page.getByRole("button", { name: /Ver lista de exercícios/ }).click();
    await page.getByRole("button", { name: "Ir para Supino Inclinado com Halteres" }).click();
    await expect(page.getByRole("heading", { name: "Supino Inclinado com Halteres" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desfazer série 1", exact: true })).toBeVisible();
  });

  test("trocar, remover e adicionar valem só para hoje", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Flexivel", ["Supino Inclinado com Halteres", "Rosca Martelo", "Abdominal 3/4"]);
    await iniciar(page, "Flexivel");
    const painel = page.getByRole("dialog");

    await page.getByRole("button", { name: /Ver lista de exercícios/ }).click();
    await page.getByRole("button", { name: "Trocar Rosca Martelo" }).click();
    await page.getByPlaceholder("Buscar exercício...").fill("Rosca Direta com Barra");
    await page.getByRole("button", { name: "Adicionar Rosca Direta com Barra", exact: true }).click();
    await expect(page.getByText(/Trocado por Rosca Direta com Barra/)).toBeVisible();

    await page.getByRole("button", { name: /Ver lista de exercícios/ }).click();
    await page.getByRole("button", { name: "Remover Abdominal 3/4 do treino de hoje" }).click();
    await expect(painel.getByRole("button", { name: "Ir para Abdominal 3/4" })).toBeHidden();

    await painel.getByRole("button", { name: "Adicionar exercício" }).click();
    await page.getByPlaceholder("Buscar exercício...").fill("Leg Press");
    await page.getByRole("button", { name: "Adicionar Leg Press", exact: true }).click();
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await expect(painel.getByRole("button", { name: "Ir para Leg Press" })).toBeVisible();
    await expect(painel.getByRole("button", { name: "Ir para Rosca Direta com Barra" })).toBeVisible();

    // Exercício com série feita não pode ser trocado: a série sumiria.
    await page.keyboard.press("Escape");
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await page.getByRole("button", { name: /Ver lista de exercícios/ }).click();
    await expect(page.getByRole("button", { name: "Trocar Supino Inclinado com Halteres" })).toBeHidden();
    await page.keyboard.press("Escape");

    // A ficha salva continua igual.
    await page.goto("/meus-treinos");
    await acaoDaFicha(page, "Editar", "Flexivel");
    await expect(page.getByRole("button", { name: "Configurar Rosca Martelo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Configurar Abdominal 3/4" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Configurar Leg Press" })).toBeHidden();
  });

  test("ajuste rápido de carga e repetições, só na série da vez", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");

    await page.getByRole("button", { name: "Aumentar peso da série 1" }).click();
    await expect(peso(page, 1)).toHaveValue("22.5");
    await page.getByRole("button", { name: "Diminuir repetições da série 1" }).click();
    await expect(reps(page, 1)).toHaveValue("9");
    await expect(page.getByRole("button", { name: "Aumentar peso da série 2" })).toBeHidden();

    await concluir(page, 1);
    await expect(peso(page, 2)).toHaveValue("22.5");
    await expect(page.getByRole("button", { name: "Aumentar peso da série 2" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Aumentar peso da série 1" })).toBeHidden();
  });

  test("corrigir série feita não reinicia o descanso, e valor apagado não vai para o histórico", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    await page.getByRole("button", { name: "Pausar descanso" }).click();
    const tempo = await page.getByRole("timer").textContent();

    await peso(page, 1).fill("25");
    await expect(page.getByRole("button", { name: "Desfazer série 1", exact: true })).toBeVisible();
    await expect(page.getByRole("timer")).toHaveText(tempo as string);
    // Corrigir a série feita não muda o que já está nas próximas.
    await expect(peso(page, 2)).toHaveValue("20");

    await reps(page, 1).fill("");
    await page.getByRole("button", { name: "Finalizar", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText("Confira a série 1 de Supino Inclinado com Halteres")).toBeVisible();
    await expect(page.getByText("Treino concluído")).toBeHidden();

    await reps(page, 1).fill("10");
    await finalizar(page);
    await expect(page.getByText("250 kg")).toBeVisible();
  });

  test("fim do descanso: toca o som e o aviso fica até dispensar", async ({ page }) => {
    await page.addInitScript(() => {
      const janela = window as unknown as { bipes: number };
      janela.bipes = 0;
      const original = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function (this: AudioContext) {
        janela.bipes += 1;
        return original.call(this);
      };
    });
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Menos 15 segundos" }).click();

    await expect(page.getByText("Hora da próxima série")).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { bipes: number }).bipes))
      .toBe(3);

    // Continua à vista bem depois: não some como um aviso comum.
    await page.waitForTimeout(3_000);
    await expect(page.getByText("Hora da próxima série")).toBeVisible();
    await expect(page.getByRole("timer")).toContainText(/O descanso acabou há 0:0\d/);

    await page.getByRole("button", { name: "Dispensar aviso" }).click();
    await expect(page.getByText("Hora da próxima série")).toBeHidden();
    expect(await page.evaluate(() => (window as unknown as { bipes: number }).bipes)).toBe(3);
  });

  test("som desligado nos ajustes não toca", async ({ page }) => {
    await page.addInitScript(() => {
      const janela = window as unknown as { bipes: number };
      janela.bipes = 0;
      const original = AudioContext.prototype.createOscillator;
      AudioContext.prototype.createOscillator = function (this: AudioContext) {
        janela.bipes += 1;
        return original.call(this);
      };
    });
    await criarConta(page);
    await page.getByRole("button", { name: "Ajustes" }).click();
    await page.getByRole("switch", { name: /Som no fim do descanso/ }).click();
    await expect(page.getByRole("switch", { name: /Som no fim do descanso/ })).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");

    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Menos 15 segundos" }).click();
    await expect(page.getByText("Hora da próxima série")).toBeVisible({ timeout: 20_000 });
    expect(await page.evaluate(() => (window as unknown as { bipes: number }).bipes)).toBe(0);
  });

  test("fora da tela de treino, o descanso continua à vista em qualquer aba", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);

    await page.getByRole("button", { name: "Voltar ao início" }).click();
    const barra = page.getByRole("button", { name: /Continuar Treino de teste/ });
    await expect(barra).toContainText(/Descanso \d:\d\d/);

    await page.getByRole("button", { name: "Evolução", exact: true }).click();
    await expect(barra).toBeVisible();
    await page.getByRole("button", { name: "Exercícios", exact: true }).click();
    await expect(barra).toBeVisible();

    // A barra não pode cobrir o fim da tela.
    await page.goto("/meus-treinos");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await acaoDaFicha(page, "Excluir", "Treino de teste");
    await page.keyboard.press("Escape");

    await barra.click();
    await expect(page).toHaveURL(/\/treino$/);
    await page.getByRole("button", { name: "Pular descanso" }).click();
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Continuar Treino de teste/ })).toContainText("2 séries pendentes");
  });

  test("tempo em minutos e segundos: prancha de 45 s fica 0:45 em toda parte", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Isometria", ["Prancha"]);
    await acaoDaFicha(page, "Editar", "Isometria");
    await page.getByRole("button", { name: "Configurar Prancha" }).click();
    await page.getByLabel("Segundos").fill("45");
    await expect(page.getByText(/0:45/)).toBeVisible();
    await page.getByRole("button", { name: "60s", exact: true }).click();
    await page.getByRole("button", { name: "30s", exact: true }).click();
    await expect(page.getByText(/30s de descanso/)).toBeVisible();
    await page.getByRole("button", { name: "Salvar" }).click();

    await iniciar(page, "Isometria");
    const minutos = page.getByLabel("Minutos da série 1", { exact: true });
    const segundos = page.getByLabel("Segundos da série 1", { exact: true });
    await expect(segundos).toHaveValue("45");
    await expect(minutos).toHaveValue("0");
    await page.getByRole("button", { name: "Aumentar segundos da série 1" }).click();
    await expect(minutos).toHaveValue("1");
    await expect(segundos).toHaveValue("0");
    await page.getByRole("button", { name: "Diminuir segundos da série 1" }).click();
    await expect(minutos).toHaveValue("1");
    await minutos.fill("0");
    await segundos.fill("45");
    await concluir(page, 1);
    await finalizar(page);
    await expect(page.getByText("0:45")).toBeVisible();
  });
});

test.describe("acessibilidade e padrões", () => {
  for (const tema of ["dark", "light"]) {
    test(`estados que antes ficavam de fora, sem violações graves, tema ${tema}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript((t) => localStorage.setItem("theme", t), tema);
      const analisar = async (nome: string) => {
        await page.waitForTimeout(500);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const graves = violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(graves, nome).toEqual([]);
      };

      await criarConta(page);
      await page.goto("/meus-treinos/modelos");
      await page.getByRole("button", { name: /^ABC(?!D)/ }).click();
      await analisar("modelo aberto");
      await page.getByRole("button", { name: "Usar este modelo" }).click();
      await expect(page.getByRole("heading", { name: "Treino C - Pernas" })).toBeVisible();
      await analisar("treinos com dias e músculos");
      // Durante a animação de saída, o aviso fica transparente e o axe mede um contraste que não existe.
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, { timeout: 10_000 });

      await acaoDaFicha(page, "Editar", "Treino C - Pernas");
      await page.getByRole("button", { name: "Configurar Agachamento Livre com Barra" }).click();
      await analisar("edição com exercício aberto");
      await page.getByRole("button", { name: "Catálogo", exact: true }).click();
      await page.getByRole("button", { name: "Filtros" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Pernas", exact: true }).click();
      await analisar("catálogo com filtros");
      await page.keyboard.press("Escape");
      await page.goto("/meus-treinos");

      await iniciar(page, "Treino C - Pernas");
      await page.getByLabel("Peso da série 1 em kg").fill("80");
      for (const n of [1, 2, 3, 4]) await page.getByRole("button", { name: `Concluir série ${n}`, exact: true }).click();
      await expect(page.getByRole("heading", { name: "Leg Press" })).toBeVisible();
      await analisar("treino com exercício concluído");
      await page.getByRole("button", { name: /Ver lista de exercícios/ }).click();
      await analisar("lista do treino");
      await page.keyboard.press("Escape");

      for (let i = 0; i < 5; i++) await page.getByRole("button", { name: "Menos 15 segundos" }).click();
      await expect(page.getByText("Hora da próxima série")).toBeVisible({ timeout: 25_000 });
      await analisar("fim do descanso");
      await page.getByRole("button", { name: "Dispensar aviso" }).click();

      await page.getByRole("button", { name: "Voltar ao início" }).click();
      await expect(page.getByRole("button", { name: /Continuar Treino C/ })).toBeVisible();
      await analisar("barra de treino ativo");
      await page.goto("/treino");
      await finalizar(page);
      await page.getByRole("button", { name: "Corrigir" }).click();
      await analisar("corrigir treino");
      await page.keyboard.press("Escape");
      await page.goto("/conta");
      await page.getByRole("button", { name: "Sair da conta" }).click();
      await analisar("confirmar saída");
    });
  }

  test("cada tela tem título próprio, e o foco acompanha a navegação", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/^Entrar · /);
    await criarConta(page);
    await expect(page).toHaveTitle("Início · Diário de Academia");

    const barra = page.getByRole("navigation", { name: "Principal" });
    await expect(barra.getByRole("button", { name: "Início" })).toHaveAttribute("aria-current", "page");
    await barra.getByRole("button", { name: "Exercícios" }).click();
    await expect(page).toHaveTitle("Exercícios · Diário de Academia");
    await expect(barra.getByRole("button", { name: "Exercícios" })).toHaveAttribute("aria-current", "page");
    await expect(barra.getByRole("button", { name: "Início" })).not.toHaveAttribute("aria-current", "page");
    await expect(page.locator("main")).toBeFocused();

    await page.goto("/termos");
    await expect(page).toHaveTitle(/^Termos de uso · /);
  });

  test("login: gerenciador de senhas entende os campos, e dá para ver a senha", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#signin-email")).toHaveAttribute("autocomplete", "email");
    const senha = page.locator("#signin-password");
    await expect(senha).toHaveAttribute("autocomplete", "current-password");
    await senha.fill("minha-senha");
    await expect(senha).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(senha).toHaveAttribute("type", "text");
    await expect(senha).toHaveValue("minha-senha");
    await page.getByRole("button", { name: "Ocultar senha" }).click();
    await expect(senha).toHaveAttribute("type", "password");

    await page.getByRole("tab", { name: "Cadastrar" }).click();
    await expect(page.locator("#signup-password")).toHaveAttribute("autocomplete", "new-password");
    await expect(page.getByText("Pelo menos 6 caracteres.")).toBeVisible();
  });

  test("catálogo funciona só com o teclado, e os filtros usam o seletor do sistema", async ({ page }) => {
    await criarConta(page);
    await page.goto("/meus-treinos/criar");
    await page.getByRole("button", { name: "Catálogo", exact: true }).click();
    const detalhes = page.getByRole("button", { name: "Ver detalhes de Supino Reto com Barra - Pegada Média" });
    await detalhes.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Como executar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Recolher Supino Reto com Barra - Pegada Média" })).toHaveAttribute("aria-expanded", "true");

    await page.getByRole("button", { name: "Filtros" }).click();
    await page.getByLabel("Equipamento").selectOption("machine");
    await expect(page.getByRole("button", { name: /^Adicionar/ }).first()).toHaveAccessibleName("Adicionar Voador (Peck Deck)");
  });

  test("fechar painéis tem área de toque de 44 px", async ({ page }) => {
    await criarConta(page);
    await page.getByRole("button", { name: "Ajustes" }).click();
    const caixa = await page.getByRole("dialog").getByRole("button", { name: "Fechar" }).boundingBox();
    expect(caixa?.width).toBeGreaterThanOrEqual(44);
    expect(caixa?.height).toBeGreaterThanOrEqual(44);
  });

  test("mensagem de erro dá tempo de ler", async ({ page }) => {
    await page.goto("/");
    await page.locator("#signin-email").fill("ninguem@exemplo.com");
    await page.locator("#signin-password").fill("senha-errada");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    const erro = page.getByText("Email ou senha incorretos.");
    await expect(erro).toBeVisible();
    await page.waitForTimeout(5_000);
    await expect(erro).toBeVisible();
  });
});

test.describe("sinal ruim na academia", () => {
  test("finalizar antes de os dados carregarem mostra o resumo e não ressuscita o treino", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await peso(page, 1).fill("20");
    await concluir(page, 1);
    // Tempo para o rascunho chegar à nuvem: é ele que poderia voltar depois de finalizar.
    await page.waitForTimeout(1500);

    // Abre o app de novo com a rede lenta: as leituras ainda estão a caminho ao finalizar.
    await page.route(/google\.firestore\.v1\.Firestore/, async (rota) => {
      await new Promise((r) => setTimeout(r, 2500));
      await rota.continue().catch(() => undefined);
    });
    await page.goto("/treino");
    await page.getByRole("button", { name: "Finalizar", exact: true }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Finalizar" }).click();
    await expect(page.getByText("Treino concluído")).toBeVisible();

    // Mesmo depois de as leituras atrasadas chegarem, continua no resumo, com o treino certo.
    await page.waitForTimeout(6000);
    await expect(page.getByText("Treino concluído")).toBeVisible();
    await expect(page.getByText("200 kg")).toBeVisible();

    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();
    await page.waitForTimeout(3000);
    await expect(page.getByRole("button", { name: /Continuar Treino de teste/ })).toBeHidden();
    await expect(page.getByRole("heading", { name: "Último treino" })).toBeVisible();
  });
});

test.describe("início e evolução", () => {
  test("sem dias definidos, a tela inicial sugere o próximo da sequência", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Treino B");
    await criarTreino(page, "Treino A");
    await page.goto("/");

    const proximo = page.getByRole("region", { name: "Próximo treino" });
    await expect(proximo).toContainText("Próximo da sua sequência");
    await expect(proximo).toContainText("Treino A");

    await proximo.getByRole("button", { name: "Iniciar" }).click();
    await page.getByLabel("Peso da série 1 em kg").fill("20");
    await concluir(page, 1);
    await finalizar(page);
    await page.getByRole("button", { name: "Concluir", exact: true }).click();
    await expect(proximo).toContainText("Treino B");
  });

  test("escolher outro treino, repetir o último e ver a semana", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await criarTreino(page, "Outro treino");
    await page.goto("/meus-treinos");
    await iniciar(page);
    await page.getByLabel("Peso da série 1 em kg").fill("20");
    await concluir(page, 1);
    await finalizar(page);
    await page.getByRole("button", { name: "Concluir", exact: true }).click();

    const nomeDeHoje = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][new Date().getDay()];
    await expect(page.getByRole("region", { name: "Esta semana" })).toContainText(`${nomeDeHoje}: treino feito`);

    // O mês cabe em uma linha e leva à Evolução.
    await page.getByRole("button", { name: /Neste mês/ }).click();
    await expect(page).toHaveURL(/\/evolucao/);
    await page.goBack();

    await page.getByRole("button", { name: "Escolher outro treino" }).click();
    await expect(page.getByRole("heading", { name: "Meus Treinos" })).toBeVisible();
    await page.goBack();

    await page.getByRole("region", { name: "Último treino" }).getByRole("button", { name: "Repetir" }).click();
    await expect(page).toHaveURL(/\/treino$/);
    await expect(peso(page, 1)).toHaveValue("20");
  });

  test("a ficha mostra os exercícios antes de começar, sem abrir a edição", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Ficha", ["Supino Inclinado com Halteres", "Abdominal 3/4"]);
    await page.getByRole("button", { name: "Detalhes de Ficha", exact: true }).click();
    const ficha = page.getByRole("dialog");
    await expect(ficha.getByText("Supino Inclinado com Halteres")).toBeVisible();
    await expect(ficha.getByText("3 × 10 · 60s de descanso").first()).toBeVisible();
    await ficha.getByRole("button", { name: "Iniciar" }).click();
    await expect(page).toHaveURL(/\/treino$/);
  });

  test("o cartão inteiro abre a ficha", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page, "Toque");
    await page.getByRole("heading", { name: "Toque", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("Supino Inclinado com Halteres");
  });

  test("evolução em abas: a aba escolhida fica no endereço e sobrevive à recarga", async ({ page }) => {
    await criarConta(page);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await page.getByLabel("Peso da série 1 em kg").fill("20");
    await concluir(page, 1);
    await finalizar(page);

    await page.goto("/evolucao");
    await expect(page.getByRole("region", { name: "Comparação entre períodos" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Conquistas" })).toBeHidden();

    await abaDaEvolucao(page, "Conquistas");
    await expect(page).toHaveURL(/aba=conquistas/);
    await expect(page.getByRole("region", { name: "Conquistas" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Comparação entre períodos" })).toBeHidden();
    await page.reload();
    await expect(page.getByRole("tab", { name: "Conquistas" })).toHaveAttribute("aria-selected", "true");
  });

  test("1RM estimado: Premium vê o número; gratuito vê o que ganharia, sem número falso", async ({ page, request }) => {
    const email = emailNovo();
    const conta = await request.post(
      "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key",
      { data: { email, password: SENHA, returnSecureToken: true } },
    );
    const uid = (await conta.json()).localId as string;
    await entrar(page, email);
    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await page.getByLabel("Peso da série 1 em kg").fill("100");
    await concluir(page, 1);
    await finalizar(page);

    const url = `/evolucao/exercicio/${encodeURIComponent("Supino Inclinado com Halteres")}`;
    await page.goto(url);
    await expect(page.getByRole("heading", { name: "1RM estimado" })).toBeVisible();
    await expect(page.getByText("133,3 kg")).toBeHidden();

    const premium = await request.patch(`${FIRESTORE}/entitlements/${uid}`, {
      headers: COMO_ADMIN,
      data: { fields: { plano: { stringValue: "premium" } } },
    });
    expect(premium.ok()).toBe(true);
    await page.reload();
    // 100 kg × 10 repetições.
    await expect(page.getByText("133,3 kg")).toBeVisible();
  });

  test("computador: painel com largura limitada e Evolução em duas colunas", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await criarConta(page);
    await page.goto("/exercicios");
    await page.getByPlaceholder("Buscar exercício...").fill("Supino Reto com Barra - Pegada Média");
    await page.getByRole("button", { name: /Supino Reto com Barra - Pegada Média/ }).first().click();
    const foto = await page.getByRole("dialog").locator("img").first().boundingBox();
    expect(foto!.width).toBeLessThanOrEqual(300);
    await expect(page.getByText("Como executar")).toBeInViewport();
    await page.keyboard.press("Escape");

    await criarTreino(page);
    await page.goto("/meus-treinos");
    await iniciar(page);
    await page.getByLabel("Peso da série 1 em kg").fill("20");
    await concluir(page, 1);
    await finalizar(page);
    await page.goto("/evolucao");
    const a = await page.getByRole("region", { name: "Frequência semanal" }).boundingBox();
    const b = await page.getByRole("region", { name: "Volume semanal" }).boundingBox();
    expect(Math.abs(a!.y - b!.y)).toBeLessThan(4);
    expect(b!.x).toBeGreaterThan(a!.x + a!.width - 1);
  });
});

test.describe("lançamento", () => {
  test("termos e privacidade abrem sem login, e o cadastro aponta para eles", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: "Cadastrar" }).click();
    await page.getByRole("link", { name: "política de privacidade" }).click();
    await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
    await expect(page.getByText("Não vendemos seus dados")).toBeVisible();
    await expect(page.getByRole("link", { name: "pauloalberto13@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:pauloalberto13@gmail.com",
    );

    await page.goto("/termos");
    await expect(page.getByRole("heading", { name: "Termos de uso" })).toBeVisible();
    await expect(page.getByText(/não substitui médicos ou profissionais/)).toBeVisible();
  });

  test("conta nova pede confirmação de email, e dá para reenviar", async ({ page }) => {
    await criarConta(page);
    await page.goto("/conta");
    await expect(page.getByRole("region", { name: "Confirmar email" })).toBeVisible();
    await page.getByRole("button", { name: "Reenviar email" }).click();
    await expect(page.getByText("Email enviado")).toBeVisible();
  });

  test("a tela fica ligada durante o treino", async ({ page }) => {
    await page.addInitScript(() => {
      const janela = window as unknown as { travas: number };
      janela.travas = 0;
      Object.defineProperty(navigator, "wakeLock", {
        value: {
          request: async () => {
            janela.travas += 1;
            return { release: async () => undefined };
          },
        },
      });
    });
    await criarConta(page);
    await criarTreino(page);
    expect(await page.evaluate(() => (window as unknown as { travas: number }).travas)).toBe(0);
    await iniciar(page);
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { travas: number }).travas))
      .toBeGreaterThan(0);
  });

  for (const tema of ["dark", "light"]) {
    test(`acessibilidade sem violações graves, tema ${tema}`, async ({ page }) => {
      await page.addInitScript((t) => localStorage.setItem("theme", t), tema);
      const analisar = async (nome: string) => {
        await page.waitForTimeout(600);
        const { violations } = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa"])
          .analyze();
        const graves = violations
          .filter((v) => v.impact === "serious" || v.impact === "critical")
          .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
        expect(graves, nome).toEqual([]);
      };

      await page.goto("/");
      await expect(page.locator("#signin-email")).toBeVisible();
      await analisar("login");

      await criarConta(page);
      await analisar("início");

      await criarTreino(page);
      await analisar("treinos");

      await page.goto("/exercicios");
      await expect(page.getByRole("heading", { name: "Exercícios" })).toBeVisible();
      await analisar("exercícios");

      await page.goto("/meus-treinos");
      await iniciar(page);
      await analisar("treino");
      await peso(page, 1).fill("20");
      await concluir(page, 1);
      await analisar("treino com descanso");
      await finalizar(page);
      await analisar("resumo");

      await page.goto("/evolucao");
      await expect(page.getByRole("heading", { name: "Evolução" })).toBeVisible();
      await analisar("evolução");

      await page.goto("/planos");
      await expect(page.getByRole("heading", { name: "Planos" })).toBeVisible();
      await analisar("planos");

      await page.goto("/conta");
      await expect(page.getByRole("heading", { name: "Minha conta" })).toBeVisible();
      await analisar("conta");

      await page.goto("/privacidade");
      await expect(page.getByRole("heading", { name: "Política de privacidade" })).toBeVisible();
      await analisar("privacidade");
    });
  }

  for (const [nome, largura, altura] of [["celular pequeno", 320, 568], ["tablet", 768, 1024]] as const) {
    test(`sem rolagem horizontal em ${nome}`, async ({ page }) => {
      await page.setViewportSize({ width: largura, height: altura });
      await criarConta(page);
      await criarTreino(page);
      await page.goto("/meus-treinos");
      await iniciar(page);
      const paginas = [
        { rota: "/treino", titulo: "Treino de teste" },
        { rota: "/", titulo: /Boa|Bom dia/ },
        { rota: "/meus-treinos", titulo: "Meus Treinos" },
        { rota: "/meus-treinos/criar", titulo: "Novo treino" },
        { rota: "/exercicios", titulo: "Exercícios" },
        { rota: "/evolucao", titulo: "Evolução" },
        { rota: "/planos", titulo: "Planos" },
        { rota: "/conta", titulo: "Minha conta" },
        { rota: "/termos", titulo: "Termos de uso" },
      ];
      for (const { rota, titulo } of paginas) {
        await page.goto(rota);
        await expect(page.getByRole("heading", { name: titulo, level: 1 })).toBeVisible();
        const sobra = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(sobra, `rolagem horizontal em ${rota}`).toBeLessThanOrEqual(0);
      }
    });
  }
});
