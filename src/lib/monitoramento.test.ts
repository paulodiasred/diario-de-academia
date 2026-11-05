import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const init = vi.fn();
const captureException = vi.fn();
vi.mock("@sentry/react", () => ({ init, captureException }));

async function carregarModulo() {
  vi.resetModules();
  return import("./monitoramento");
}

const aguardar = () => new Promise((r) => setTimeout(r, 0));

describe("monitoramento de erros", () => {
  beforeEach(() => {
    init.mockClear();
    captureException.mockClear();
  });

  afterEach(() => vi.unstubAllEnvs());

  it("sem a chave, nada é iniciado nem enviado", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    const { iniciarMonitoramento, relatarErro } = await carregarModulo();
    iniciarMonitoramento();
    relatarErro(new Error("falha"));
    await aguardar();
    expect(init).not.toHaveBeenCalled();
    expect(captureException).not.toHaveBeenCalled();
  });

  it("com a chave, envia o erro, sem dados pessoais nem histórico de cliques", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://chave@exemplo.ingest.sentry.io/1");
    const { iniciarMonitoramento, relatarErro } = await carregarModulo();
    iniciarMonitoramento();
    const erro = new Error("falha");
    relatarErro(erro, { tela: "treino" });
    await vi.waitFor(() => expect(captureException).toHaveBeenCalledWith(erro, { extra: { tela: "treino" } }));

    const opcoes = init.mock.calls[0][0];
    // O padrão do Sentry é coletar: o que a política de privacidade promete depende disto.
    expect(opcoes.dataCollection).toMatchObject({
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      stackFrameVariables: false,
    });
    expect(opcoes.tracesSampleRate).toBeUndefined();
    expect(opcoes.beforeBreadcrumb()).toBeNull();
  });

  it("tira o email das mensagens de erro", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://chave@exemplo.ingest.sentry.io/1");
    const { iniciarMonitoramento, semEmail } = await carregarModulo();
    expect(semEmail("Falha para maria.silva@exemplo.com.br agora")).toBe("Falha para [email removido] agora");

    iniciarMonitoramento();
    await vi.waitFor(() => expect(init).toHaveBeenCalled());
    const evento = init.mock.calls[0][0].beforeSend({
      message: "conta ana@exemplo.com",
      exception: { values: [{ value: "login de ana@exemplo.com falhou" }] },
    });
    expect(JSON.stringify(evento)).not.toContain("ana@exemplo.com");
  });

  it("iniciar duas vezes não duplica", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://chave@exemplo.ingest.sentry.io/1");
    const { iniciarMonitoramento } = await carregarModulo();
    iniciarMonitoramento();
    iniciarMonitoramento();
    await vi.waitFor(() => expect(init).toHaveBeenCalledTimes(1));
  });
});
