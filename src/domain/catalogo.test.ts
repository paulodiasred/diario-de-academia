import { describe, expect, it } from "vitest";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { encontrarExercicio, sugerirExercicios } from "./catalogo";

const ex = (id: string, name: string) => ({ id, name }) as ExercicioCatalogo;

const todos = [
  ex("a", "Supino com Barra"),
  ex("b", "Supino Inclinado com Halteres"),
  ex("c", "Elevação Lateral"),
  ex("d", "Barra Fixa"),
];

describe("encontrarExercicio", () => {
  it("usa o ID quando existe", () => {
    expect(encontrarExercicio(todos, "c", "Outro nome")?.id).toBe("c");
  });

  it("aceita nome idêntico, sem diferenciar acento ou maiúsculas", () => {
    expect(encontrarExercicio(todos, "fixo-x", "elevacao lateral")?.id).toBe("c");
  });

  it("nome só parecido não vira ligação automática", () => {
    expect(encontrarExercicio(todos, "fixo-x", "Supino barra")).toBeNull();
  });
});

describe("sugerirExercicios", () => {
  it("coloca primeiro quem tem mais palavras em comum", () => {
    expect(sugerirExercicios(todos, "Supino barra").map((e) => e.id)).toEqual(["a", "d", "b"]);
  });

  it("ignora palavras curtas e acentos", () => {
    expect(sugerirExercicios(todos, "elevacao de").map((e) => e.id)).toEqual(["c"]);
  });

  it("sem palavras úteis, não sugere nada", () => {
    expect(sugerirExercicios(todos, "  ")).toEqual([]);
    expect(sugerirExercicios(todos, "de")).toEqual([]);
  });

  it("respeita o limite", () => {
    expect(sugerirExercicios(todos, "supino barra", 1)).toHaveLength(1);
  });
});
