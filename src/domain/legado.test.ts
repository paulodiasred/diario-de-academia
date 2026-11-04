import { describe, expect, it } from "vitest";
import type { TreinoRegistro } from "@/data/treino";
import type { TreinoPersonalizado } from "@/types/catalogo";
import { treinoInputSchema } from "./schemas";
import {
  converterRegistrosEmSessoes,
  rotinasDoTreinoFixo,
  slug,
  usouTreinoFixo,
} from "./legado";

function registro(parcial: Partial<TreinoRegistro>): TreinoRegistro {
  return {
    id: `r-${Math.random()}`,
    userId: "u",
    exercicio: "Supino barra",
    peso: 50,
    serie: 1,
    dia: "Segunda",
    data: new Date(2026, 10, 2, 18, 0).toISOString(),
    concluida: true,
    ...parcial,
  };
}

const minuto = (m: number) => new Date(2026, 10, 2, 18, m).toISOString();

describe("converterRegistrosEmSessoes", () => {
  it("agrupa por dia e treino em uma sessão por documento", () => {
    const sessoes = converterRegistrosEmSessoes([
        registro({ serie: 1 }),
        registro({ serie: 2 }),
        registro({ dia: "treino-abc", exercicio: "Remada" }),
        registro({ data: new Date(2026, 10, 3, 18).toISOString() }),
      ], [], "u");
    expect(sessoes.map((s) => s.id).sort()).toEqual([
      "legacy-2026-11-02-segunda",
      "legacy-2026-11-02-treino-abc",
      "legacy-2026-11-03-segunda",
    ]);
  });

  it("preserva toda carga registrada, em ordem de série", () => {
    const [sessao] = converterRegistrosEmSessoes(
      [registro({ serie: 2, peso: 60 }), registro({ serie: 1, peso: 50 })], [], "u");
    expect(sessao.exercicios[0].series.map((s) => s.peso)).toEqual([50, 60]);
    expect(sessao.exercicios[0].series.every((s) => s.concluida)).toBe(true);
  });

  it("não inventa repetições nem duração", () => {
    const [sessao] = converterRegistrosEmSessoes([registro({})], [], "u");
    expect(sessao.exercicios[0].series[0]).toMatchObject({ reps: null, duracaoSeg: null });
    expect(sessao.origem).toBe("legado");
  });

  it("repetir a conversão gera o mesmo resultado: é seguro rodar de novo", () => {
    const registros = [
      registro({ id: "a", serie: 1, data: minuto(0) }),
      registro({ id: "b", serie: 2, data: minuto(3) }),
    ];
    expect(converterRegistrosEmSessoes(registros, [], "u")).toEqual(
      converterRegistrosEmSessoes([...registros].reverse(), [], "u"),
    );
  });

  it("guarda de quais registros veio e o horário real", () => {
    const [sessao] = converterRegistrosEmSessoes(
      [registro({ id: "b", data: minuto(9) }), registro({ id: "a", data: minuto(1) })], [], "u");
    expect(sessao.legadoIds).toEqual(["a", "b"]);
    expect(sessao.iniciadaEm).toBe(minuto(1));
    expect(sessao.finalizadaEm).toBe(minuto(9));
  });

  it("ignora registros não concluídos ou com data inválida, sem quebrar", () => {
    const sessoes = converterRegistrosEmSessoes(
      [registro({ concluida: false }), registro({ data: "sem data" })], [], "u");
    expect(sessoes).toEqual([]);
  });

  it("registro antigo sem o campo concluida conta como feito", () => {
    const { concluida: _c, ...semCampo } = registro({});
    expect(converterRegistrosEmSessoes([semCampo], [], "u")).toHaveLength(1);
  });

  it("cardio antigo (peso 0, série 0) vira tempo, sem carga falsa", () => {
    const [sessao] = converterRegistrosEmSessoes(
      [registro({ exercicio: "Corrida", peso: 0, serie: 0 })], [], "u");
    expect(sessao.exercicios[0].medida).toBe("tempo");
    expect(sessao.exercicios[0].series[0].peso).toBeNull();
  });

  it("liga o nome ao ID do treino personalizado e usa o nome do treino", () => {
    const treino = {
      id: "abc",
      nome: "Peito A",
      exercicios: [
        {
          exercicioId: "catalogo-1",
          exercicioNome: "Remada",
          primaryMuscles: ["lats"],
          category: "strength",
          series: 3,
          descanso: 60,
          ordem: 0,
        },
      ],
    } as TreinoPersonalizado;
    const [sessao] = converterRegistrosEmSessoes(
      [registro({ dia: "treino-abc", exercicio: "Remada" })], [treino], "u");
    expect(sessao.nome).toBe("Peito A");
    expect(sessao.treinoId).toBe("abc");
    expect(sessao.exercicios[0].exercicioId).toBe("catalogo-1");
  });

  it("exercício desconhecido recebe ID estável a partir do nome", () => {
    const [sessao] = converterRegistrosEmSessoes([registro({ exercicio: "Elevação Única" })], [], "u");
    expect(sessao.exercicios[0].exercicioId).toBe("nome-elevacao-unica");
  });
});

describe("rotinas do treino fixo", () => {
  it("só existem para quem já usou o treino fixo", () => {
    expect(usouTreinoFixo([registro({ dia: "Segunda" })])).toBe(true);
    expect(usouTreinoFixo([registro({ dia: "treino-abc" })])).toBe(false);
    expect(usouTreinoFixo([])).toBe(false);
  });

  it("contas diferentes nunca recebem o mesmo ID: a coleção é compartilhada", () => {
    const deAna = rotinasDoTreinoFixo("ana").map((r) => r.id);
    const deBia = rotinasDoTreinoFixo("bia").map((r) => r.id);
    expect(deAna.filter((id) => deBia.includes(id))).toEqual([]);
  });

  it("a conversão aponta para a rotina da própria conta", () => {
    const [sessao] = converterRegistrosEmSessoes([registro({ dia: "Segunda" })], [], "ana");
    expect(rotinasDoTreinoFixo("ana").map((r) => r.id)).toContain(sessao.treinoId);
  });

  it("todas são treinos válidos, com IDs únicos e dia definido", () => {
    const rotinas = rotinasDoTreinoFixo("u");
    expect(rotinas.length).toBeGreaterThan(0);
    expect(new Set(rotinas.map((r) => r.id)).size).toBe(rotinas.length);
    for (const { dados } of rotinas) {
      expect(() => treinoInputSchema.parse(dados)).not.toThrow();
      expect(dados.dias).toEqual([dados.nome]);
    }
  });

  it("o histórico migrado usa o mesmo ID de exercício da rotina", () => {
    const rotina = rotinasDoTreinoFixo("u").find((r) => r.dados.nome === "Segunda");
    const exercicio = rotina?.dados.exercicios[0];
    const [sessao] = converterRegistrosEmSessoes(
      [registro({ exercicio: exercicio?.exercicioNome })], [], "u");
    expect(sessao.exercicios[0].exercicioId).toBe(exercicio?.exercicioId);
  });
});

describe("slug", () => {
  it("remove acentos e símbolos", () => {
    expect(slug("Terça-Feira: Peito!")).toBe("terca-feira-peito");
  });
});
