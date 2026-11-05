import { describe, expect, it } from "vitest";
import {
  analisesUsadas,
  mesDaCota,
  montarDadosDaAnalise,
  normalizarAnalise,
  temTreinosSuficientes,
  COTA_MENSAL_DE_ANALISES,
} from "./analiseTreinos";
import type { ExercicioSessao, SerieSessao, Sessao } from "./sessao";

const AGORA = new Date(2026, 10, 30, 12);

const serie = (peso: number | null, reps: number | null, concluida = true): SerieSessao => ({
  peso,
  reps,
  duracaoSeg: null,
  distanciaM: null,
  concluida,
  concluidaEm: null,
  editada: false,
});

const exercicio = (nome: string, series: SerieSessao[], extra: Partial<ExercicioSessao> = {}): ExercicioSessao => ({
  exercicioId: nome,
  nome,
  medida: "carga_reps",
  descanso: 60,
  primaryMuscles: ["chest"],
  notas: "",
  series,
  ...extra,
});

const sessao = (diasAtras: number, exercicios: ExercicioSessao[], extra: Partial<Sessao> = {}): Sessao => {
  const data = new Date(2026, 10, 30 - diasAtras, 10).toISOString();
  return {
    id: `s${diasAtras}`,
    treinoId: null,
    nome: "Treino A",
    iniciadaEm: data,
    finalizadaEm: data,
    origem: "app",
    notas: "",
    exercicios,
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: data,
    ...extra,
  };
};

describe("dados enviados à IA", () => {
  it("compara os dois períodos com os mesmos números do app", () => {
    const dados = montarDadosDaAnalise(
      [
        sessao(1, [exercicio("Supino", [serie(100, 10), serie(100, 10)])]),
        sessao(5, [exercicio("Supino", [serie(100, 10)])]),
        sessao(40, [exercicio("Supino", [serie(100, 10)])]),
      ],
      AGORA,
    );
    expect(dados.atual).toMatchObject({ treinos: 2, series: 3, volumeKg: 3000 });
    expect(dados.anterior).toMatchObject({ treinos: 1, series: 1, volumeKg: 1000 });
    expect(dados.variacaoPercentual).toEqual({ treinos: 100, series: 200, volumeKg: 200 });
  });

  it("mostra a evolução do exercício em ordem cronológica, pelo melhor valor de cada treino", () => {
    const dados = montarDadosDaAnalise(
      [
        sessao(1, [exercicio("Supino", [serie(80, 10), serie(70, 12)])]),
        sessao(20, [exercicio("Supino", [serie(60, 10)])]),
      ],
      AGORA,
    );
    expect(dados.exercicios[0]).toMatchObject({
      nome: "Supino",
      treinos: 2,
      series: 3,
      cargaKg: { inicio: 60, fim: 80 },
    });
    expect(dados.exercicios[0].rmEstimadoKg?.inicio).toBe(80);
  });

  it("série não concluída não conta", () => {
    const dados = montarDadosDaAnalise([sessao(1, [exercicio("Supino", [serie(500, 10, false)])])], AGORA);
    expect(dados.exercicios).toEqual([]);
  });

  it("carga menor que a de antes do período não é recorde", () => {
    const dados = montarDadosDaAnalise(
      [
        sessao(1, [exercicio("Supino", [serie(90, 5)])]),
        sessao(100, [exercicio("Supino", [serie(100, 5)])]),
      ],
      AGORA,
    );
    expect(dados.recordes).toEqual([]);
  });

  it("recorde conta só se foi batido no período", () => {
    const dados = montarDadosDaAnalise(
      [
        sessao(2, [exercicio("Supino", [serie(110, 5)])]),
        sessao(100, [exercicio("Supino", [serie(100, 5)])]),
      ],
      AGORA,
    );
    expect(dados.recordes).toHaveLength(1);
    expect(dados.recordes[0]).toMatchObject({ exercicio: "Supino" });
  });

  it("não leva observações, nome do treino, IDs nem datas", () => {
    const dados = montarDadosDaAnalise(
      [
        sessao(1, [exercicio("Supino", [serie(100, 10)], { notas: "SEGREDO-EXERCICIO", exercicioId: "SEGREDO-ID" })], {
          nome: "SEGREDO-TREINO",
          notas: "SEGREDO-SESSAO",
          treinoId: "SEGREDO-ID",
        }),
      ],
      AGORA,
    );
    const texto = JSON.stringify(dados);
    expect(texto).not.toContain("SEGREDO");
    expect(texto).not.toContain("2026");
  });

  it("limita o tamanho dos nomes escritos pela pessoa", () => {
    const dados = montarDadosDaAnalise([sessao(1, [exercicio("x".repeat(500), [serie(10, 10)])])], AGORA);
    expect(dados.exercicios[0].nome).toHaveLength(60);
  });
});

describe("mínimo de treinos", () => {
  const treinos = (n: number) => Array.from({ length: n }, (_, i) => sessao(i + 1, []));

  it("pede 4 treinos no período", () => {
    expect(temTreinosSuficientes(treinos(3), AGORA)).toBe(false);
    expect(temTreinosSuficientes(treinos(4), AGORA)).toBe(true);
  });

  it("treino antigo não conta", () => {
    expect(temTreinosSuficientes([...treinos(3), sessao(45, [])], AGORA)).toBe(false);
  });
});

describe("resposta da IA", () => {
  it("corta o que passa dos limites", () => {
    const analise = normalizarAnalise({
      resumo: "  ok  ",
      evolucao: ["1", "2", "3", "4"],
      atencao: ["  ", "a"],
      sugestoes: ["x".repeat(1000)],
    });
    expect(analise?.resumo).toBe("ok");
    expect(analise?.evolucao).toHaveLength(3);
    expect(analise?.atencao).toEqual(["a"]);
    expect(analise?.sugestoes[0]).toHaveLength(300);
  });

  it("sem resumo, a resposta não serve", () => {
    expect(normalizarAnalise({ resumo: "  ", evolucao: [], atencao: [], sugestoes: [] })).toBeNull();
  });
});

describe("cota mensal", () => {
  it("o contador de outro mês já não vale", () => {
    expect(analisesUsadas({ mes: "2026-10", analises: COTA_MENSAL_DE_ANALISES }, AGORA)).toBe(0);
    expect(analisesUsadas({ mes: mesDaCota(AGORA), analises: 3 }, AGORA)).toBe(3);
    expect(analisesUsadas(null, AGORA)).toBe(0);
  });

  it("o mês usa dois dígitos", () => {
    expect(mesDaCota(new Date(2026, 0, 15))).toBe("2026-01");
  });
});
