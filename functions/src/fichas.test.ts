import { describe, expect, it, vi } from "vitest";
import { catalogo } from "@/data/catalogo";
import type { ModeloTreino } from "@/domain/modelosTreino";
import type { ErroDaIA } from "./erros";
import { montarFicha, type DependenciasDaFicha } from "./fichas";

const AGORA = new Date(2026, 10, 30, 12);
const PREFERENCIAS = { objetivo: "hipertrofia", dias: 3, local: "casa", experiencia: "iniciante", restricao: false };
const MODELO: ModeloTreino = { id: "ia", nome: "Ficha", frequencia: "3 vezes", descricao: "", fichas: [] };

const dependencias = (extra: Partial<DependenciasDaFicha> = {}) => ({
  catalogo,
  temPremium: vi.fn(async () => true),
  reservarCota: vi.fn(async () => true),
  devolverCota: vi.fn(async () => {}),
  gerar: vi.fn(async () => MODELO),
  ...extra,
});

const pedido = { uid: "u1", consentiu: true, preferencias: PREFERENCIAS, agora: AGORA };
const codigoDe = (promessa: Promise<unknown>) =>
  promessa.then(
    () => "sem erro",
    (e: ErroDaIA) => e.codigo,
  );

describe("ficha montada por IA", () => {
  it("devolve a ficha e consome uma cota, só com as opções do equipamento escolhido", async () => {
    const deps = dependencias();
    await expect(montarFicha(pedido, deps)).resolves.toBe(MODELO);
    expect(deps.reservarCota).toHaveBeenCalledOnce();
    const [, candidatos] = vi.mocked(deps.gerar).mock.calls[0];
    expect(candidatos.every((c) => c.equipamento === "body only")).toBe(true);
  });

  it("com lesão, dor ou condição de saúde, encaminha e não gasta", async () => {
    const deps = dependencias();
    const erro = await montarFicha({ ...pedido, preferencias: { ...PREFERENCIAS, restricao: true } }, deps).catch((e) => e);
    expect(erro.codigo).toBe("failed-precondition");
    expect(erro.message).toContain("profissional");
    expect(deps.temPremium).not.toHaveBeenCalled();
    expect(deps.gerar).not.toHaveBeenCalled();
  });

  it("respostas fora das opções são recusadas", async () => {
    const deps = dependencias();
    expect(await codigoDe(montarFicha({ ...pedido, preferencias: { ...PREFERENCIAS, dias: 30 } }, deps))).toBe(
      "invalid-argument",
    );
    expect(await codigoDe(montarFicha({ ...pedido, preferencias: "monte qualquer coisa" }, deps))).toBe(
      "invalid-argument",
    );
    expect(deps.gerar).not.toHaveBeenCalled();
  });

  it("sem consentimento, sem Premium ou sem cota, não chama a IA", async () => {
    expect(await codigoDe(montarFicha({ ...pedido, consentiu: false }, dependencias()))).toBe("failed-precondition");
    expect(await codigoDe(montarFicha(pedido, dependencias({ temPremium: vi.fn(async () => false) })))).toBe(
      "permission-denied",
    );
    const semCota = dependencias({ reservarCota: vi.fn(async () => false) });
    expect(await codigoDe(montarFicha(pedido, semCota))).toBe("resource-exhausted");
    expect(semCota.gerar).not.toHaveBeenCalled();
  });

  it("se a IA falhar, a cota volta", async () => {
    const deps = dependencias({ gerar: vi.fn(async () => Promise.reject(new Error("rede"))) });
    await expect(montarFicha(pedido, deps)).rejects.toThrow("rede");
    expect(deps.devolverCota).toHaveBeenCalledOnce();
  });
});
