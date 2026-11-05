import { describe, expect, it, vi } from "vitest";
import type { Sessao } from "@/domain/sessao";
import { analisarTreinos, type DependenciasDaAnalise } from "./analisar";
import type { ErroDaIA } from "./erros";

const AGORA = new Date(2026, 10, 30, 12);

const sessoes = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const data = new Date(2026, 10, 29 - i, 10).toISOString();
    return {
      id: `s${i}`,
      treinoId: null,
      nome: "Treino",
      iniciadaEm: data,
      finalizadaEm: data,
      origem: "app",
      notas: "",
      exercicios: [],
      exercicioAtual: 0,
      descanso: null,
      atualizadaEm: data,
    } as Sessao;
  });

const ANALISE = { resumo: "ok", evolucao: [], atencao: [], sugestoes: [] };

const dependencias = (extra: Partial<DependenciasDaAnalise> = {}) => ({
  temPremium: vi.fn(async () => true),
  lerSessoes: vi.fn(async () => sessoes(4)),
  reservarCota: vi.fn(async () => true),
  devolverCota: vi.fn(async () => {}),
  gerar: vi.fn(async () => ({ analise: ANALISE, modelo: "m" })),
  salvar: vi.fn(async () => {}),
  ...extra,
});

const pedido = { uid: "u1", consentiu: true, agora: AGORA };

const codigoDe = (promessa: Promise<unknown>) =>
  promessa.then(
    () => "sem erro",
    (e: ErroDaIA) => e.codigo,
  );

describe("análise de treinos", () => {
  it("gera, salva e devolve a análise, consumindo uma cota", async () => {
    const deps = dependencias();
    await expect(analisarTreinos(pedido, deps)).resolves.toEqual(ANALISE);
    expect(deps.salvar).toHaveBeenCalledWith("u1", ANALISE, "m", AGORA);
    expect(deps.reservarCota).toHaveBeenCalledOnce();
    expect(deps.devolverCota).not.toHaveBeenCalled();
  });

  it("sem consentimento, não lê nada nem gasta", async () => {
    const deps = dependencias();
    expect(await codigoDe(analisarTreinos({ ...pedido, consentiu: false }, deps))).toBe("failed-precondition");
    expect(deps.lerSessoes).not.toHaveBeenCalled();
    expect(deps.gerar).not.toHaveBeenCalled();
  });

  it("sem Premium, não lê os treinos nem gasta", async () => {
    const deps = dependencias({ temPremium: vi.fn(async () => false) });
    expect(await codigoDe(analisarTreinos(pedido, deps))).toBe("permission-denied");
    expect(deps.lerSessoes).not.toHaveBeenCalled();
    expect(deps.gerar).not.toHaveBeenCalled();
  });

  it("com poucos treinos, não consome a cota", async () => {
    const deps = dependencias({ lerSessoes: vi.fn(async () => sessoes(3)) });
    expect(await codigoDe(analisarTreinos(pedido, deps))).toBe("failed-precondition");
    expect(deps.reservarCota).not.toHaveBeenCalled();
    expect(deps.gerar).not.toHaveBeenCalled();
  });

  it("cota esgotada não chama a IA", async () => {
    const deps = dependencias({ reservarCota: vi.fn(async () => false) });
    expect(await codigoDe(analisarTreinos(pedido, deps))).toBe("resource-exhausted");
    expect(deps.gerar).not.toHaveBeenCalled();
    expect(deps.devolverCota).not.toHaveBeenCalled();
  });

  it("se a IA falhar, a cota volta", async () => {
    const deps = dependencias({ gerar: vi.fn(async () => Promise.reject(new Error("rede"))) });
    await expect(analisarTreinos(pedido, deps)).rejects.toThrow("rede");
    expect(deps.devolverCota).toHaveBeenCalledOnce();
    expect(deps.salvar).not.toHaveBeenCalled();
  });

  it("se salvar falhar, a cota volta", async () => {
    const deps = dependencias({ salvar: vi.fn(async () => Promise.reject(new Error("banco"))) });
    await expect(analisarTreinos(pedido, deps)).rejects.toThrow("banco");
    expect(deps.devolverCota).toHaveBeenCalledOnce();
  });
});
