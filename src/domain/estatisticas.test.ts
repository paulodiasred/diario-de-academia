import { describe, expect, it } from "vitest";
import type { TreinoPersonalizado } from "@/types/catalogo";
import {
  calendarioDoMes,
  compararPeriodos,
  exerciciosTreinados,
  inicioDaSemana,
  proximoTreino,
  recordesBatidos,
  resumoDoMes,
  resumoDoPeriodo,
  semanasRecentes,
  sequenciaDeSemanas,
  treinosDaSemana,
  variacaoPercentual,
} from "./estatisticas";
import type { Sessao, SerieSessao } from "./sessao";

// 5 de novembro de 2026 é uma quinta-feira. A semana começa na segunda, dia 2.
const AGORA = new Date(2026, 10, 5, 18, 0);

const serie = (peso: number | null, reps: number | null, concluida = true): SerieSessao => ({
  peso,
  reps,
  duracaoSeg: null,
  distanciaM: null,
  concluida,
  concluidaEm: null,
  editada: false,
});

function sessao(
  data: Date,
  series: SerieSessao[] = [serie(50, 10)],
  extra: Partial<Sessao> & { nomeExercicio?: string; minutos?: number } = {},
): Sessao {
  const { nomeExercicio = "Supino", minutos = 60, ...resto } = extra;
  const fim = new Date(data.getTime() + minutos * 60_000).toISOString();
  return {
    id: `s-${data.getTime()}-${nomeExercicio}`,
    treinoId: "t1",
    nome: "Treino",
    iniciadaEm: data.toISOString(),
    finalizadaEm: fim,
    origem: "app",
    notas: "",
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: fim,
    exercicios: [
      {
        exercicioId: nomeExercicio.toLowerCase(),
        nome: nomeExercicio,
        medida: "carga_reps",
        descanso: 60,
        primaryMuscles: [],
        notas: "",
        series,
      },
    ],
    ...resto,
  };
}

const dia = (d: number, mes = 10) => new Date(2026, mes, d, 12);

describe("inicioDaSemana", () => {
  it("a semana começa na segunda", () => {
    expect(inicioDaSemana(AGORA)).toEqual(new Date(2026, 10, 2));
  });

  it("domingo pertence à semana que começou na segunda anterior", () => {
    expect(inicioDaSemana(new Date(2026, 10, 8, 23))).toEqual(new Date(2026, 10, 2));
  });

  it("a própria segunda é o início, à meia-noite", () => {
    expect(inicioDaSemana(new Date(2026, 10, 2, 0, 1))).toEqual(new Date(2026, 10, 2));
  });
});

describe("resumoDoPeriodo", () => {
  const inicio = dia(1);
  const fim = dia(30);

  it("soma volume, séries e tempo a partir de valores conhecidos", () => {
    const resumo = resumoDoPeriodo(
      [
        sessao(dia(2), [serie(50, 10), serie(60, 8)], { minutos: 45 }),
        sessao(dia(4), [serie(100, 5)], { minutos: 30 }),
      ],
      inicio,
      fim,
    );
    expect(resumo).toEqual({
      treinos: 2,
      diasAtivos: 2,
      series: 3,
      volumeKg: 50 * 10 + 60 * 8 + 100 * 5,
      seriesSemReps: 0,
      tempoSeg: 75 * 60,
      sessoesSemTempo: 0,
    });
  });

  it("registro antigo fica fora do volume e do tempo, mas conta em treinos e séries", () => {
    const resumo = resumoDoPeriodo(
      [
        sessao(dia(2), [serie(50, 10)]),
        sessao(dia(3), [serie(80, null), serie(90, null)], { origem: "legado", legadoIds: [] }),
      ],
      inicio,
      fim,
    );
    expect(resumo).toMatchObject({
      treinos: 2,
      series: 3,
      volumeKg: 500,
      seriesSemReps: 2,
      tempoSeg: 3600,
      sessoesSemTempo: 1,
    });
  });

  it("peso corporal e cardio não geram volume nem contam como dado faltando", () => {
    const resumo = resumoDoPeriodo([sessao(dia(2), [serie(null, 12), serie(null, null)])], inicio, fim);
    expect(resumo).toMatchObject({ series: 2, volumeKg: 0, seriesSemReps: 0 });
  });

  it("ignora séries não concluídas e sessões não finalizadas", () => {
    const resumo = resumoDoPeriodo(
      [
        sessao(dia(2), [serie(50, 10), serie(99, 99, false)]),
        sessao(dia(3), [serie(99, 99)], { finalizadaEm: null }),
      ],
      inicio,
      fim,
    );
    expect(resumo).toMatchObject({ treinos: 1, series: 1, volumeKg: 500 });
  });

  it("dois treinos no mesmo dia contam como dois treinos e um dia ativo", () => {
    const resumo = resumoDoPeriodo(
      [sessao(new Date(2026, 10, 2, 8)), sessao(new Date(2026, 10, 2, 19))],
      inicio,
      fim,
    );
    expect(resumo).toMatchObject({ treinos: 2, diasAtivos: 1 });
  });

  it("o início entra no período, e o fim, não", () => {
    const resumo = resumoDoPeriodo([sessao(inicio), sessao(fim)], inicio, fim);
    expect(resumo.treinos).toBe(1);
  });

  it("sem dados, tudo é zero", () => {
    expect(resumoDoPeriodo([], inicio, fim)).toMatchObject({ treinos: 0, volumeKg: 0, tempoSeg: 0 });
  });
});

describe("treinosDaSemana e resumoDoMes", () => {
  it("conta só a semana atual, sem a anterior", () => {
    const sessoes = [sessao(dia(1)), sessao(dia(2)), sessao(dia(5))];
    expect(treinosDaSemana(sessoes, AGORA)).toBe(2);
  });

  it("o mês vai do dia 1 ao último dia", () => {
    const sessoes = [sessao(dia(31, 9)), sessao(dia(1)), sessao(dia(30)), sessao(dia(1, 11))];
    expect(resumoDoMes(sessoes, AGORA).treinos).toBe(2);
  });
});

describe("compararPeriodos e variacaoPercentual", () => {
  it("compara os últimos dias com os imediatamente anteriores", () => {
    const sessoes = [sessao(dia(5)), sessao(dia(4)), sessao(dia(28, 9)), sessao(dia(1, 9))];
    const { atual, anterior } = compararPeriodos(sessoes, 7, AGORA);
    expect(atual.treinos).toBe(2);
    expect(anterior.treinos).toBe(1);
  });

  it("calcula a variação", () => {
    expect(variacaoPercentual(150, 100)).toBe(50);
    expect(variacaoPercentual(75, 100)).toBe(-25);
    expect(variacaoPercentual(100, 100)).toBe(0);
  });

  it("sem base de comparação não inventa porcentagem", () => {
    expect(variacaoPercentual(100, 0)).toBeNull();
  });
});

describe("semanasRecentes", () => {
  it("inclui semanas vazias, em ordem cronológica, terminando na atual", () => {
    const semanas = semanasRecentes([sessao(dia(5)), sessao(dia(21, 9))], AGORA, 3);
    expect(semanas.map((s) => s.treinos)).toEqual([1, 0, 1]);
    expect(semanas.map((s) => s.rotulo)).toEqual(["19/10", "26/10", "02/11"]);
    expect(semanas[2].volumeKg).toBe(500);
  });
});

describe("sequenciaDeSemanas", () => {
  it("conta semanas seguidas", () => {
    expect(sequenciaDeSemanas([sessao(dia(5)), sessao(dia(28, 9)), sessao(dia(21, 9))], AGORA)).toBe(3);
  });

  it("ainda não ter treinado nesta semana não quebra a sequência", () => {
    expect(sequenciaDeSemanas([sessao(dia(28, 9)), sessao(dia(21, 9))], AGORA)).toBe(2);
  });

  it("uma semana sem treino quebra", () => {
    expect(sequenciaDeSemanas([sessao(dia(5)), sessao(dia(21, 9))], AGORA)).toBe(1);
  });

  it("vários treinos na mesma semana contam uma vez", () => {
    expect(sequenciaDeSemanas([sessao(dia(2)), sessao(dia(3)), sessao(dia(4))], AGORA)).toBe(1);
  });

  it("sem treinos recentes é zero", () => {
    expect(sequenciaDeSemanas([sessao(dia(1, 8))], AGORA)).toBe(0);
    expect(sequenciaDeSemanas([], AGORA)).toBe(0);
  });
});

describe("recordes", () => {
  const historico = [
    sessao(dia(10), [serie(60, 5)]),
    sessao(dia(1), [serie(50, 10)]),
    sessao(dia(5), [serie(50, 10)]),
    sessao(dia(7), [serie(55, 8), serie(40, 12)]),
  ];

  it("a primeira vez e empatar não são recorde; superar é", () => {
    expect(recordesBatidos(historico).map((r) => [r.peso, r.anterior])).toEqual([
      [60, 55],
      [55, 50],
    ]);
  });

  it("cada exercício tem seu próprio recorde", () => {
    const outro = sessao(dia(11), [serie(20, 10)], { nomeExercicio: "Rosca" });
    expect(recordesBatidos([...historico, outro]).map((r) => r.nome)).not.toContain("Rosca");
  });

  it("registro antigo sem repetições também vale para carga", () => {
    const sessoes = [sessao(dia(1), [serie(50, null)]), sessao(dia(2), [serie(55, 10)])];
    expect(recordesBatidos(sessoes)).toHaveLength(1);
  });
});

describe("exerciciosTreinados", () => {
  it("resume cada exercício com vezes, melhor carga e última data", () => {
    const lista = exerciciosTreinados([
      sessao(dia(1), [serie(50, 10)]),
      sessao(dia(3), [serie(70, 5)]),
      sessao(dia(5), [serie(60, 8)]),
      sessao(dia(4), [serie(20, 10)], { nomeExercicio: "Rosca" }),
    ]);
    expect(lista.map((e) => e.nome)).toEqual(["Supino", "Rosca"]);
    expect(lista[0]).toMatchObject({
      vezes: 3,
      melhorPeso: 70,
      melhorPesoData: dia(3).toISOString(),
      ultimaData: dia(5).toISOString(),
    });
  });

  it("exercício sem carga não tem melhor peso", () => {
    const [exercicio] = exerciciosTreinados([sessao(dia(1), [serie(null, 12)])]);
    expect(exercicio).toMatchObject({ vezes: 1, melhorPeso: null });
  });
});

describe("calendarioDoMes", () => {
  it("cobre o mês em semanas completas, de segunda a domingo", () => {
    const semanas = calendarioDoMes([], 2026, 10);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
    expect(semanas[0][0].data).toEqual(new Date(2026, 9, 26));
    expect(semanas[0][0].doMes).toBe(false);
    expect(semanas.flat().filter((d) => d.doMes)).toHaveLength(30);
  });

  it("coloca o treino no dia certo", () => {
    const dias = calendarioDoMes([sessao(dia(5))], 2026, 10).flat();
    expect(dias.find((d) => d.chave === "2026-11-05")?.sessoes).toHaveLength(1);
    expect(dias.filter((d) => d.sessoes.length > 0)).toHaveLength(1);
  });
});

describe("proximoTreino", () => {
  const treino = (id: string, dias: string[]) =>
    ({ id, nome: id, dias, exercicios: [] }) as unknown as TreinoPersonalizado;

  it("hoje, se há treino programado", () => {
    expect(proximoTreino([treino("a", ["Quinta"])], [], AGORA)).toMatchObject({
      dia: "Quinta",
      emDias: 0,
    });
  });

  it("procura o próximo dia programado", () => {
    expect(proximoTreino([treino("a", ["Sábado"])], [], AGORA)).toMatchObject({
      dia: "Sábado",
      emDias: 2,
    });
  });

  it("depois de fazer o de hoje, aponta para a próxima vez", () => {
    const feito = sessao(new Date(2026, 10, 5, 8), undefined, { treinoId: "a" });
    expect(proximoTreino([treino("a", ["Quinta"])], [feito], AGORA)).toMatchObject({ emDias: 7 });
  });

  it("sem agenda, não há próximo treino", () => {
    expect(proximoTreino([treino("a", [])], [], AGORA)).toBeNull();
  });
});
