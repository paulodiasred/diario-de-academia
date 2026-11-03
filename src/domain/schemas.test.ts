import { describe, expect, it } from "vitest";
import { normalizarRegistro, normalizarTreino } from "./schemas";

const exercicio = {
  exercicioId: "x",
  exercicioNome: "Supino",
  primaryMuscles: ["chest"],
  category: "strength",
  series: 3,
  descanso: 60,
  ordem: 0,
};

describe("normalizarTreino (regressão B1)", () => {
  it.each([[undefined], [""], ["   "]])("descrição %j não vira undefined", (descricao) => {
    const dados = normalizarTreino({ nome: "A", descricao, dias: [], exercicios: [exercicio] });
    expect(dados.descricao).toBe("");
    expect(Object.values(dados)).not.toContain(undefined);
  });

  it("remove espaços do nome e da descrição", () => {
    const dados = normalizarTreino({
      nome: "  Peito  ",
      descricao: "  foco  ",
      exercicios: [exercicio],
    });
    expect(dados).toMatchObject({ nome: "Peito", descricao: "foco", dias: [] });
  });

  it("rejeita nome vazio e treino sem exercícios", () => {
    expect(() => normalizarTreino({ nome: "  ", exercicios: [exercicio] })).toThrow();
    expect(() => normalizarTreino({ nome: "A", exercicios: [] })).toThrow();
  });

  it("preserva campos desconhecidos de exercícios já salvos", () => {
    const dados = normalizarTreino({
      nome: "A",
      exercicios: [{ ...exercicio, campoAntigo: 1 } as typeof exercicio],
    });
    expect(dados.exercicios[0]).toHaveProperty("campoAntigo", 1);
  });
});

describe("normalizarRegistro", () => {
  const valido = { exercicio: "Supino", peso: 50, serie: 1, dia: "Segunda" };

  it("marca como concluída por padrão", () => {
    expect(normalizarRegistro(valido).concluida).toBe(true);
  });

  it("aceita peso 0, usado pelo cardio", () => {
    expect(normalizarRegistro({ ...valido, peso: 0, serie: 0 }).peso).toBe(0);
  });

  it.each([
    ["peso negativo", { peso: -1 }],
    ["peso absurdo", { peso: 2001 }],
    ["série fracionada", { serie: 1.5 }],
    ["exercício vazio", { exercicio: "" }],
  ])("rejeita %s", (_nome, alteracao) => {
    expect(() => normalizarRegistro({ ...valido, ...alteracao })).toThrow();
  });
});
