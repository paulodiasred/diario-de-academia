import { describe, expect, it } from "vitest";
import type { ExercicioNoTreino } from "@/types/catalogo";
import {
  adicionarSerie,
  ajustarDescanso,
  alternarSerie,
  atualizarSerie,
  contarSeriesPendentes,
  criarSessao,
  descreverSerie,
  duracaoDaSessao,
  finalizarSessao,
  historicoDoExercicio,
  iniciarDescanso,
  pausarDescanso,
  pontosEvolucao,
  removerSerie,
  removerSerieDoHistorico,
  resumirSessao,
  retomarDescanso,
  segundosRestantes,
  temSerieConcluida,
  validarCorrecao,
  type Sessao,
  type SerieSessao,
} from "./sessao";

describe("descrição da série com tempo", () => {
  const serie = (parcial: Partial<SerieSessao>): SerieSessao => ({
    peso: null,
    reps: null,
    duracaoSeg: null,
    distanciaM: null,
    concluida: true,
    concluidaEm: null,
    editada: false,
    ...parcial,
  });

  it("não arredonda segundos para minutos (45 s não vira 1 min, 20 s não vira 0 min)", () => {
    expect(descreverSerie(serie({ duracaoSeg: 45 }), "tempo")).toBe("0:45");
    expect(descreverSerie(serie({ duracaoSeg: 20 }), "tempo")).toBe("0:20");
    expect(descreverSerie(serie({ duracaoSeg: 90 }), "tempo")).toBe("1:30");
  });

  it("mostra horas quando passa de 60 minutos e combina com a distância", () => {
    expect(descreverSerie(serie({ duracaoSeg: 3900 }), "tempo")).toBe("1:05:00");
    expect(descreverSerie(serie({ duracaoSeg: 1800, distanciaM: 5000 }), "distancia")).toBe("30:00 × 5000 m");
  });

  it("cardio sem tempo informado continua como feito", () => {
    expect(descreverSerie(serie({}), "tempo")).toBe("Feito");
  });
});

describe("correção de treino finalizado", () => {
  const serieFeita = (parcial: Partial<SerieSessao> = {}): SerieSessao => ({
    peso: 50,
    reps: 10,
    duracaoSeg: null,
    distanciaM: null,
    concluida: true,
    concluidaEm: "2026-11-03T18:10:00.000Z",
    editada: false,
    ...parcial,
  });
  const sessaoFinalizada = (parcial: Partial<Sessao> = {}, series = [serieFeita(), serieFeita()]): Sessao => ({
    id: "s1",
    treinoId: "t1",
    nome: "Peito",
    iniciadaEm: "2026-11-03T18:00:00.000Z",
    finalizadaEm: "2026-11-03T19:00:00.000Z",
    origem: "app",
    notas: "",
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: "2026-11-03T19:00:00.000Z",
    exercicios: [
      { exercicioId: "supino", nome: "Supino", medida: "carga_reps", descanso: 60, primaryMuscles: ["chest"], notas: "", series },
    ],
    ...parcial,
  });

  it("corrigir um peso errado derruba o recorde falso", () => {
    const anterior = sessaoFinalizada({ id: "s0", iniciadaEm: "2026-10-01T18:00:00.000Z", finalizadaEm: "2026-10-01T19:00:00.000Z" });
    const errada = sessaoFinalizada({}, [serieFeita({ peso: 500 })]);
    expect(resumirSessao(errada, [anterior, errada]).recordes).toHaveLength(1);
    const corrigida = atualizarSerie(errada, 0, 0, { peso: 52.5 });
    const recordes = resumirSessao(corrigida, [anterior, corrigida]).recordes;
    expect(recordes.map((r) => r.peso)).toEqual([52.5]);
  });

  it("remover a última série tira o exercício do treino", () => {
    const uma = removerSerieDoHistorico(sessaoFinalizada(), 0, 0);
    expect(uma.exercicios[0].series).toHaveLength(1);
    expect(removerSerieDoHistorico(uma, 0, 0).exercicios).toHaveLength(0);
  });

  it("aponta a primeira série inválida", () => {
    const sessao = sessaoFinalizada({}, [serieFeita(), serieFeita({ reps: null })]);
    expect(validarCorrecao(sessao)).toEqual({ exercicio: 0, serie: 1, erro: "reps" });
    expect(validarCorrecao(sessaoFinalizada({}, [serieFeita({ peso: 3000 })]))?.erro).toBe("peso");
    expect(validarCorrecao(sessaoFinalizada())).toBeNull();
  });

  it("registro antigo pode continuar sem repetições, mas não com carga absurda", () => {
    const sem = sessaoFinalizada({ origem: "legado" }, [serieFeita({ reps: null })]);
    expect(validarCorrecao(sem)).toBeNull();
    const absurda = sessaoFinalizada({ origem: "legado" }, [serieFeita({ peso: 3000, reps: null })]);
    expect(validarCorrecao(absurda)?.erro).toBe("peso");
  });
});

const INICIO = new Date("2026-11-03T18:00:00Z");

function exercicio(parcial: Partial<ExercicioNoTreino> = {}): ExercicioNoTreino {
  return {
    exercicioId: "supino",
    exercicioNome: "Supino",
    primaryMuscles: ["chest"],
    category: "strength",
    series: 3,
    descanso: 60,
    ordem: 0,
    medida: "carga_reps",
    ...parcial,
  };
}

const treino = (exercicios: ExercicioNoTreino[]) => ({ id: "t1", nome: "Peito", exercicios });

function preencher(sessao: Sessao, e: number, s: number, peso: number, reps: number) {
  return atualizarSerie(sessao, e, s, { peso, reps });
}

/** Sessão finalizada com as cargas e repetições informadas. */
function sessaoFeita(id: string, data: string, series: Array<[number, number | null]>): Sessao {
  let sessao = criarSessao(
    id,
    treino([exercicio({ series: series.length })]),
    [],
    new Date(data),
  );
  series.forEach(([peso, reps], i) => {
    sessao = atualizarSerie(sessao, 0, i, { peso, reps: reps ?? 1 });
    sessao = alternarSerie(sessao, 0, i, new Date(data)).sessao;
    if (reps === null) {
      sessao = {
        ...sessao,
        exercicios: sessao.exercicios.map((e) => ({
          ...e,
          series: e.series.map((x, j) => (j === i ? { ...x, reps: null } : x)),
        })),
      };
    }
  });
  return finalizarSessao(sessao, new Date(new Date(data).getTime() + 3600_000));
}

describe("criarSessao", () => {
  it("segue a ordem do treino, não a ordem da lista", () => {
    const sessao = criarSessao(
      "s",
      treino([
        exercicio({ exercicioId: "b", exercicioNome: "B", ordem: 1 }),
        exercicio({ exercicioId: "a", exercicioNome: "A", ordem: 0 }),
      ]),
      [],
      INICIO,
    );
    expect(sessao.exercicios.map((e) => e.nome)).toEqual(["A", "B"]);
  });

  it("sem histórico, usa as metas do treino e deixa vazio o que não existe", () => {
    const [ex] = criarSessao("s", treino([exercicio({ repsAlvo: 10 })]), [], INICIO).exercicios;
    expect(ex.series[0]).toMatchObject({ peso: null, reps: 10, concluida: false });
  });

  it("recupera os últimos valores, série a série", () => {
    const anterior = sessaoFeita("a", "2026-11-01T18:00:00Z", [[50, 10], [55, 8]]);
    const [ex] = criarSessao("s", treino([exercicio({ series: 3, repsAlvo: 12 })]), [anterior], INICIO)
      .exercicios;
    expect(ex.series.map((s) => [s.peso, s.reps])).toEqual([
      [50, 10],
      [55, 8],
      [55, 8],
    ]);
  });

  it("usa a sessão mais recente, em qualquer ordem de entrada", () => {
    const velha = sessaoFeita("v", "2026-10-01T18:00:00Z", [[40, 10]]);
    const nova = sessaoFeita("n", "2026-11-01T18:00:00Z", [[60, 10]]);
    const [ex] = criarSessao("s", treino([exercicio()]), [velha, nova], INICIO).exercicios;
    expect(ex.series[0].peso).toBe(60);
  });

  it("não inventa repetições a partir de registros antigos sem repetições", () => {
    const antiga = sessaoFeita("a", "2026-11-01T18:00:00Z", [[50, null]]);
    const [ex] = criarSessao("s", treino([exercicio()]), [antiga], INICIO).exercicios;
    expect(ex.series[0]).toMatchObject({ peso: 50, reps: null });
  });

  it("treino antigo, sem o campo medida, continua funcionando", () => {
    const antigo = { ...exercicio(), medida: undefined };
    expect(criarSessao("s", treino([antigo]), [], INICIO).exercicios[0].medida).toBe("carga_reps");
    const cardio = { ...exercicio({ category: "cardio" }), medida: undefined };
    expect(criarSessao("s", treino([cardio]), [], INICIO).exercicios[0].medida).toBe("tempo");
  });
});

describe("alternarSerie: registro com um toque", () => {
  const base = () =>
    preencher(criarSessao("s", treino([exercicio()]), [], INICIO), 0, 0, 50, 10);

  it("conclui a série com os valores já preenchidos e inicia o descanso", () => {
    const { sessao, erro } = alternarSerie(base(), 0, 0, INICIO);
    expect(erro).toBeNull();
    expect(sessao.exercicios[0].series[0].concluida).toBe(true);
    expect(sessao.descanso?.duracaoSeg).toBe(60);
  });

  it("repassa os valores às próximas séries, para concluí-las também com um toque", () => {
    const { sessao } = alternarSerie(base(), 0, 0, INICIO);
    expect(sessao.exercicios[0].series[1]).toMatchObject({ peso: 50, reps: 10, concluida: false });
  });

  it("não sobrescreve uma série que o usuário já editou", () => {
    const editada = preencher(base(), 0, 2, 70, 5);
    const { sessao } = alternarSerie(editada, 0, 0, INICIO);
    expect(sessao.exercicios[0].series[2]).toMatchObject({ peso: 70, reps: 5 });
  });

  it("recusa carga sem peso ou sem repetições", () => {
    const vazia = criarSessao("s", treino([exercicio()]), [], INICIO);
    expect(alternarSerie(vazia, 0, 0, INICIO).erro).toBe("peso");
    expect(alternarSerie(atualizarSerie(vazia, 0, 0, { peso: 50 }), 0, 0, INICIO).erro).toBe("reps");
    expect(alternarSerie(vazia, 0, 0, INICIO).sessao).toBe(vazia);
  });

  it("recusa valores absurdos", () => {
    const absurda = preencher(criarSessao("s", treino([exercicio()]), [], INICIO), 0, 0, 5000, 10);
    expect(alternarSerie(absurda, 0, 0, INICIO).erro).toBe("peso");
  });

  it("aceita peso corporal sem carga, mas exige repetições", () => {
    const sessao = criarSessao("s", treino([exercicio({ medida: "peso_corporal" })]), [], INICIO);
    expect(alternarSerie(sessao, 0, 0, INICIO).erro).toBe("reps");
    expect(alternarSerie(atualizarSerie(sessao, 0, 0, { reps: 12 }), 0, 0, INICIO).erro).toBeNull();
  });

  it("aceita tempo e distância só como 'feito', como o cardio antigo", () => {
    for (const medida of ["tempo", "distancia"] as const) {
      const sessao = criarSessao("s", treino([exercicio({ medida })]), [], INICIO);
      expect(alternarSerie(sessao, 0, 0, INICIO).erro).toBeNull();
    }
  });

  it("segundo toque desfaz", () => {
    const { sessao } = alternarSerie(base(), 0, 0, INICIO);
    const desfeita = alternarSerie(sessao, 0, 0, INICIO).sessao;
    expect(desfeita.exercicios[0].series[0]).toMatchObject({ concluida: false, concluidaEm: null });
  });

  it("ao terminar um exercício, avança para o próximo pendente", () => {
    let sessao = criarSessao(
      "s",
      treino([
        exercicio({ series: 1 }),
        exercicio({ exercicioId: "b", exercicioNome: "B", ordem: 1, medida: "tempo" }),
      ]),
      [],
      INICIO,
    );
    sessao = preencher(sessao, 0, 0, 50, 10);
    expect(alternarSerie(sessao, 0, 0, INICIO).sessao.exercicioAtual).toBe(1);
  });

  it("não inicia descanso depois da última série do treino", () => {
    const sessao = preencher(
      criarSessao("s", treino([exercicio({ series: 1 })]), [], INICIO),
      0,
      0,
      50,
      10,
    );
    expect(alternarSerie(sessao, 0, 0, INICIO).sessao.descanso).toBeNull();
  });
});

describe("séries", () => {
  const base = () => criarSessao("s", treino([exercicio({ series: 2 })]), [], INICIO);

  it("adicionar copia os valores da última série, sem concluir", () => {
    const sessao = adicionarSerie(preencher(base(), 0, 1, 80, 6), 0);
    expect(sessao.exercicios[0].series[2]).toMatchObject({ peso: 80, reps: 6, concluida: false });
  });

  it("remover mantém pelo menos uma série", () => {
    const uma = removerSerie(base(), 0, 0);
    expect(uma.exercicios[0].series).toHaveLength(1);
    expect(removerSerie(uma, 0, 0).exercicios[0].series).toHaveLength(1);
  });

  it("conta as pendentes", () => {
    expect(contarSeriesPendentes(base())).toBe(2);
    expect(temSerieConcluida(base())).toBe(false);
  });
});

describe("descanso", () => {
  const T0 = INICIO.getTime();

  it("calcula pelo relógio, sobrevivendo a recarga e segundo plano", () => {
    expect(segundosRestantes(iniciarDescanso(60, INICIO), T0 + 45_000)).toBe(15);
    expect(segundosRestantes(iniciarDescanso(60, INICIO), T0 + 999_000)).toBe(0);
  });

  it("pausar e retomar preserva o tempo restante (regressão B6)", () => {
    const pausado = pausarDescanso(iniciarDescanso(60, INICIO), T0 + 20_000);
    expect(segundosRestantes(pausado, T0 + 500_000)).toBe(40);
    const retomado = retomarDescanso(pausado, T0 + 500_000);
    expect(segundosRestantes(retomado, T0 + 510_000)).toBe(30);
  });

  it("±15s ajusta, e zerar encerra", () => {
    const d = iniciarDescanso(60, INICIO);
    expect(segundosRestantes(ajustarDescanso(d, 15, T0) as NonNullable<typeof d>, T0)).toBe(75);
    expect(segundosRestantes(ajustarDescanso(d, -15, T0) as NonNullable<typeof d>, T0)).toBe(45);
    expect(ajustarDescanso(d, -15, T0 + 50_000)).toBeNull();
  });

  it("ajustar durante a pausa continua pausado", () => {
    const pausado = pausarDescanso(iniciarDescanso(60, INICIO), T0);
    expect(ajustarDescanso(pausado, 15, T0)).toMatchObject({ fimEm: null, restanteSeg: 75 });
  });
});

describe("finalização e resumo", () => {
  it("o histórico guarda só o que foi feito", () => {
    let sessao = criarSessao(
      "s",
      treino([exercicio(), exercicio({ exercicioId: "b", exercicioNome: "B", ordem: 1 })]),
      [],
      INICIO,
    );
    sessao = preencher(sessao, 0, 0, 50, 10);
    sessao = alternarSerie(sessao, 0, 0, INICIO).sessao;
    const final = finalizarSessao(sessao, new Date(INICIO.getTime() + 1800_000));
    expect(final.exercicios).toHaveLength(1);
    expect(final.exercicios[0].series).toHaveLength(1);
    expect(final.descanso).toBeNull();
    expect(duracaoDaSessao(final)).toBe(1800);
  });

  it("calcula volume, séries e duração a partir de valores conhecidos", () => {
    const final = sessaoFeita("s", "2026-11-03T18:00:00Z", [[50, 10], [60, 8]]);
    expect(resumirSessao(final, [])).toMatchObject({
      duracaoSeg: 3600,
      exercicios: 1,
      series: 2,
      volumeKg: 50 * 10 + 60 * 8,
      seriesSemReps: 0,
      recordes: [],
    });
  });

  it("série sem repetições fica fora do volume e é contada à parte", () => {
    const final = sessaoFeita("s", "2026-11-03T18:00:00Z", [[50, 10], [60, null]]);
    expect(resumirSessao(final, [])).toMatchObject({ volumeKg: 500, seriesSemReps: 1 });
  });

  it("sessão migrada não tem duração estimada", () => {
    const antiga = { ...sessaoFeita("s", "2026-11-03T18:00:00Z", [[50, 10]]), origem: "legado" as const };
    expect(duracaoDaSessao(antiga)).toBeNull();
  });

  it("recorde exige superar um histórico existente", () => {
    const antes = sessaoFeita("a", "2026-11-01T18:00:00Z", [[50, 10]]);
    const igual = sessaoFeita("i", "2026-11-02T18:00:00Z", [[50, 10]]);
    const maior = sessaoFeita("m", "2026-11-03T18:00:00Z", [[55, 10]]);
    expect(resumirSessao(antes, [])).toMatchObject({ recordes: [] });
    expect(resumirSessao(igual, [antes]).recordes).toEqual([]);
    expect(resumirSessao(maior, [antes, igual]).recordes).toEqual([
      { nome: "Supino", peso: 55, anterior: 50 },
    ]);
  });
});

describe("evolução por exercício", () => {
  const sessoes = Array.from({ length: 15 }, (_, i) =>
    sessaoFeita(`s${i}`, new Date(2026, 0, i + 1, 12).toISOString(), [[i + 1, 10]]),
  );

  it("mostra as 10 sessões mais recentes, não as mais antigas (regressão B2)", () => {
    const pesos = pontosEvolucao(sessoes, "supino", "Supino").map((p) => p.peso);
    expect(pesos).toContain(15);
    expect(pesos).not.toContain(5);
  });

  it("fica em ordem cronológica, em qualquer ordem de entrada", () => {
    const esperado = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    expect(pontosEvolucao(sessoes, "supino", "Supino").map((p) => p.peso)).toEqual(esperado);
    expect(pontosEvolucao([...sessoes].reverse(), "supino", "Supino").map((p) => p.peso)).toEqual(
      esperado,
    );
  });

  it("usa a maior carga de cada sessão", () => {
    const uma = sessaoFeita("u", "2026-01-01T12:00:00Z", [[40, 10], [70, 5], [50, 8]]);
    expect(pontosEvolucao([uma], "supino", "Supino").map((p) => p.peso)).toEqual([70]);
  });

  it("encontra pelo nome o histórico antigo com outro ID", () => {
    const antiga = sessaoFeita("a", "2026-01-01T12:00:00Z", [[40, 10]]);
    expect(historicoDoExercicio([antiga], "id-novo", "Supino")).toHaveLength(1);
    expect(historicoDoExercicio([antiga], "id-novo", "Outro")).toHaveLength(0);
  });
});
