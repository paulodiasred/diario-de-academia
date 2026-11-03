import { describe, expect, it } from "vitest";
import type { TreinoRegistro } from "@/data/treino";
import {
  exercicioConcluidoHoje,
  historicoPorDia,
  localizarRegistroParaDesmarcar,
  ordenarMaisRecentes,
  pontosDoGrafico,
  seriesFeitasHoje,
  ultimoPeso,
} from "./registros";

const AGORA = new Date(2026, 10, 3, 18, 0);
const alvo = { exercicio: "Supino barra", dia: "Segunda" };

function registro(parcial: Partial<TreinoRegistro>): TreinoRegistro {
  return {
    id: "r",
    userId: "u",
    exercicio: alvo.exercicio,
    dia: alvo.dia,
    peso: 50,
    serie: 1,
    data: new Date(2026, 10, 3, 17, 0).toISOString(),
    concluida: true,
    ...parcial,
  };
}

describe("pontosDoGrafico (regressão B2)", () => {
  // Lista como vem do repositório: mais recente primeiro. Dia 15 é o mais novo.
  const registros = Array.from({ length: 15 }, (_, i) =>
    registro({ peso: 15 - i, data: new Date(2026, 0, 15 - i).toISOString() }),
  );

  it("mostra os 10 mais recentes, não os 10 mais antigos", () => {
    const pesos = pontosDoGrafico(registros).map((p) => p.peso);
    expect(pesos).toContain(15);
    expect(pesos).not.toContain(5);
  });

  it("fica em ordem cronológica", () => {
    expect(pontosDoGrafico(registros).map((p) => p.peso)).toEqual([
      6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
    ]);
  });

  it("dá o mesmo resultado qualquer que seja a ordem de entrada", () => {
    expect(pontosDoGrafico([...registros].reverse())).toEqual(pontosDoGrafico(registros));
  });
});

describe("exercicioConcluidoHoje (regressão B3)", () => {
  const series = [1, 2, 3].map((serie) => registro({ serie }));

  it("reconhece o exercício concluído pelos dados realmente gravados, sem exercicioId", () => {
    expect(series[0]).not.toHaveProperty("exercicioId");
    expect(exercicioConcluidoHoje(series, alvo, 3, AGORA)).toBe(true);
  });

  it("não conclui com séries faltando", () => {
    expect(exercicioConcluidoHoje(series.slice(0, 2), alvo, 3, AGORA)).toBe(false);
  });

  it("não conta o mesmo exercício feito em outro treino", () => {
    const outroTreino = series.map((r) => ({ ...r, dia: "treino-abc" }));
    expect(exercicioConcluidoHoje(outroTreino, alvo, 3, AGORA)).toBe(false);
  });

  it("não conta dias anteriores", () => {
    const ontem = series.map((r) => ({ ...r, data: new Date(2026, 10, 2, 17).toISOString() }));
    expect(exercicioConcluidoHoje(ontem, alvo, 3, AGORA)).toBe(false);
  });

  it("repetir a mesma série não conta duas vezes", () => {
    expect(exercicioConcluidoHoje([registro({}), registro({})], alvo, 2, AGORA)).toBe(false);
  });

  it("cardio conclui com o registro da série 0", () => {
    const cardio = { exercicio: "Esteira", dia: "Segunda" };
    const registros = [registro({ ...cardio, peso: 0, serie: 0 })];
    expect(exercicioConcluidoHoje(registros, cardio, 1, AGORA)).toBe(true);
  });
});

describe("localizarRegistroParaDesmarcar (regressão B4)", () => {
  it("nunca escolhe a mesma série de outro treino, mesmo sendo mais recente", () => {
    const deste = registro({ id: "deste", data: new Date(2026, 10, 3, 17).toISOString() });
    const deOutro = registro({
      id: "de-outro",
      dia: "treino-abc",
      data: new Date(2026, 10, 3, 17, 30).toISOString(),
    });
    expect(localizarRegistroParaDesmarcar([deOutro, deste], alvo, 1, AGORA)?.id).toBe("deste");
  });

  it("nunca escolhe registro de dia anterior", () => {
    const ontem = registro({ data: new Date(2026, 10, 2, 17).toISOString() });
    expect(localizarRegistroParaDesmarcar([ontem], alvo, 1, AGORA)).toBeNull();
  });

  it("escolhe só a série pedida", () => {
    const registros = [registro({ id: "s1", serie: 1 }), registro({ id: "s2", serie: 2 })];
    expect(localizarRegistroParaDesmarcar(registros, alvo, 2, AGORA)?.id).toBe("s2");
  });
});

describe("demais cálculos", () => {
  it("ordenarMaisRecentes não altera a lista original", () => {
    const original = [
      registro({ id: "velho", data: "2026-01-01T00:00:00.000Z" }),
      registro({ id: "novo", data: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(ordenarMaisRecentes(original)[0].id).toBe("novo");
    expect(original[0].id).toBe("velho");
  });

  it("ultimoPeso usa o registro mais recente; null sem histórico", () => {
    const registros = [
      registro({ peso: 40, data: "2026-01-01T00:00:00.000Z" }),
      registro({ peso: 60, data: "2026-02-01T00:00:00.000Z" }),
    ];
    expect(ultimoPeso(registros, alvo.exercicio)).toBe(60);
    expect(ultimoPeso(registros, "Outro")).toBeNull();
  });

  it("seriesFeitasHoje ignora registros não concluídos", () => {
    const feitas = seriesFeitasHoje(
      [registro({ serie: 1 }), registro({ serie: 2, concluida: false })],
      alvo,
      AGORA,
    );
    expect([...feitas]).toEqual([1]);
  });

  it("historicoPorDia calcula a média e respeita a janela de 7 dias", () => {
    const historico = historicoPorDia(
      [
        registro({ peso: 40 }),
        registro({ peso: 60, serie: 2 }),
        registro({ peso: 100, data: new Date(2026, 9, 1).toISOString() }),
      ],
      AGORA,
    );
    expect(historico).toHaveLength(1);
    expect(historico[0]).toMatchObject({ media: 50, series: 2 });
  });
});
