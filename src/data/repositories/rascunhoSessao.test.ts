import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/domain/sessao";

const gravarRascunhoRemoto = vi.fn().mockResolvedValue(undefined);
vi.mock("./sessoesRepository", () => ({
  gravarRascunhoRemoto: (...args: unknown[]) => gravarRascunhoRemoto(...args),
}));

const {
  descarregarRascunho,
  escolherRascunho,
  esquecerRascunhoLocal,
  guardarRascunho,
  lerRascunhoLocal,
  limparRascunhosLocais,
} = await import("./rascunhoSessao");

const sessao = (atualizadaEm: string, id = "s") => ({ id, atualizadaEm }) as Sessao;

describe("rascunho do treino em andamento", () => {
  beforeEach(() => {
    localStorage.clear();
    gravarRascunhoRemoto.mockClear();
    esquecerRascunhoLocal("u");
  });

  it("grava no aparelho na hora, mesmo quando a nuvem ainda vai esperar", () => {
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z"), false);
    expect(lerRascunhoLocal("u")?.id).toBe("s");
    expect(gravarRascunhoRemoto).not.toHaveBeenCalled();
  });

  it("agrupa a digitação em uma gravação na nuvem", () => {
    vi.useFakeTimers();
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z", "a"), false);
    guardarRascunho("u", sessao("2026-01-01T00:00:01Z", "b"), false);
    vi.advanceTimersByTime(1000);
    vi.useRealTimers();
    expect(gravarRascunhoRemoto).toHaveBeenCalledTimes(1);
    expect(gravarRascunhoRemoto.mock.calls[0][1].id).toBe("b");
  });

  it("ações importantes vão para a nuvem na hora", () => {
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z"), true);
    expect(gravarRascunhoRemoto).toHaveBeenCalledTimes(1);
  });

  it("descarregar envia o que estava aguardando", () => {
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z"), false);
    descarregarRascunho();
    expect(gravarRascunhoRemoto).toHaveBeenCalledTimes(1);
  });

  it("isola as contas no mesmo aparelho", () => {
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z"), false);
    expect(lerRascunhoLocal("outra")).toBeNull();
  });

  it("rascunho corrompido não derruba o app", () => {
    localStorage.setItem("diario:treino-em-andamento:u", "{quebrado");
    expect(lerRascunhoLocal("u")).toBeNull();
  });

  it("o logout apaga só os rascunhos", () => {
    guardarRascunho("u", sessao("2026-01-01T00:00:00Z"), false);
    localStorage.setItem("outra-chave", "fica");
    limparRascunhosLocais();
    expect(lerRascunhoLocal("u")).toBeNull();
    expect(localStorage.getItem("outra-chave")).toBe("fica");
  });

  it("vence o mais recente, venha de onde vier", () => {
    const velho = sessao("2026-01-01T00:00:00Z", "velho");
    const novo = sessao("2026-01-01T00:05:00Z", "novo");
    expect(escolherRascunho(velho, novo)?.id).toBe("novo");
    expect(escolherRascunho(novo, velho)?.id).toBe("novo");
    expect(escolherRascunho(null, velho)?.id).toBe("velho");
    expect(escolherRascunho(velho, null)?.id).toBe("velho");
    expect(escolherRascunho(null, null)).toBeNull();
  });
});
