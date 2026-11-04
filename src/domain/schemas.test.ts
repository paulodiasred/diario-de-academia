import { describe, expect, it } from "vitest";
import { normalizarExercicioProprio, normalizarTreino } from "./schemas";

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

describe("normalizarExercicioProprio", () => {
  const valido = {
    name: " Meu exercício ",
    category: "strength",
    equipment: null,
    medida: "carga_reps" as const,
    primaryMuscles: ["chest"],
  };

  it("remove espaços e preenche listas vazias", () => {
    expect(normalizarExercicioProprio(valido)).toMatchObject({
      name: "Meu exercício",
      secondaryMuscles: [],
      instructions: [],
    });
  });

  it("exige nome e músculo principal", () => {
    expect(() => normalizarExercicioProprio({ ...valido, name: "  " })).toThrow();
    expect(() => normalizarExercicioProprio({ ...valido, primaryMuscles: [] })).toThrow();
  });
});
