import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { avisarFimDoDescanso, avisoLigado, desligarAviso, ligarAviso } from "./avisoDescanso";

const mostrar = vi.fn().mockResolvedValue(undefined);

function preparar(permissao: NotificationPermission, resposta: NotificationPermission = permissao) {
  vi.stubGlobal("Notification", {
    permission: permissao,
    requestPermission: vi.fn().mockResolvedValue(resposta),
  });
  Object.defineProperty(navigator, "serviceWorker", {
    configurable: true,
    value: { ready: Promise.resolve({ showNotification: mostrar }) },
  });
}

const definirVisibilidade = (valor: DocumentVisibilityState) =>
  Object.defineProperty(document, "visibilityState", { configurable: true, value: valor });

describe("aviso de fim do descanso", () => {
  beforeEach(() => {
    localStorage.clear();
    mostrar.mockClear();
    definirVisibilidade("hidden");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    definirVisibilidade("visible");
  });

  it("começa desligado", () => {
    preparar("granted");
    expect(avisoLigado()).toBe(false);
  });

  it("só liga com a permissão concedida", async () => {
    preparar("default", "denied");
    expect(await ligarAviso()).toBe(false);
    expect(localStorage.getItem("diario:avisar-descanso")).toBeNull();
  });

  it("avisa com o app fora de vista", async () => {
    preparar("granted");
    await ligarAviso();
    await avisarFimDoDescanso();
    expect(mostrar).toHaveBeenCalledWith("Descanso finalizado", expect.objectContaining({ tag: "descanso" }));
  });

  it("não avisa com o app na tela", async () => {
    preparar("granted");
    await ligarAviso();
    definirVisibilidade("visible");
    await avisarFimDoDescanso();
    expect(mostrar).not.toHaveBeenCalled();
  });

  it("não avisa depois de desligar, nem se a permissão foi retirada", async () => {
    preparar("granted");
    await ligarAviso();
    desligarAviso();
    await avisarFimDoDescanso();
    expect(mostrar).not.toHaveBeenCalled();

    await ligarAviso();
    preparar("denied");
    await avisarFimDoDescanso();
    expect(mostrar).not.toHaveBeenCalled();
  });
});
