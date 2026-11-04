import { describe, expect, it } from "vitest";
import { calcularConquistas } from "./conquistas";
import { maiorSequenciaDeSemanas } from "./estatisticas";
import { historicoEmCsv, relatorioPorExercicioEmCsv, textoParaCompartilhar } from "./exportacao";
import { progressoDaMeta, type Meta } from "./metas";
import { LIMITES_GRATUITO, podeCriar, temPremium } from "./planos";
import type { Sessao, SerieSessao } from "./sessao";

const AGORA = new Date(2026, 10, 5, 18);

const serie = (peso: number | null, reps: number | null): SerieSessao => ({
  peso,
  reps,
  duracaoSeg: null,
  distanciaM: null,
  concluida: true,
  concluidaEm: null,
  editada: false,
});

function sessao(data: Date, series: SerieSessao[] = [serie(50, 10)], nome = "Supino", notas = ""): Sessao {
  const fim = new Date(data.getTime() + 3600_000).toISOString();
  return {
    id: `s-${data.getTime()}`,
    treinoId: "t",
    nome: "Peito",
    iniciadaEm: data.toISOString(),
    finalizadaEm: fim,
    origem: "app",
    notas: "",
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: fim,
    exercicios: [
      { exercicioId: nome, nome, medida: "carga_reps", descanso: 60, primaryMuscles: [], notas, series },
    ],
  };
}

describe("planos", () => {
  it("gratuito não é Premium", () => {
    expect(temPremium({ plano: "gratuito", expiraEm: null }, AGORA)).toBe(false);
  });

  it("Premium sem data de fim vale; com data, só até ela", () => {
    expect(temPremium({ plano: "premium", expiraEm: null }, AGORA)).toBe(true);
    expect(temPremium({ plano: "premium", expiraEm: "2099-01-01T00:00:00Z" }, AGORA)).toBe(true);
    expect(temPremium({ plano: "premium", expiraEm: "2020-01-01T00:00:00Z" }, AGORA)).toBe(false);
  });

  it("o limite vale só no gratuito, e exatamente no número definido", () => {
    const abaixo = { treinos: LIMITES_GRATUITO.treinos - 1, exercicios: 0 };
    const noLimite = { treinos: LIMITES_GRATUITO.treinos, exercicios: 0 };
    expect(podeCriar("treinos", false, abaixo)).toBe(true);
    expect(podeCriar("treinos", false, noLimite)).toBe(false);
    expect(podeCriar("treinos", true, noLimite)).toBe(true);
  });
});

describe("maiorSequenciaDeSemanas", () => {
  it("encontra a maior, mesmo que não seja a atual", () => {
    const datas = [
      new Date(2026, 8, 7, 12),
      new Date(2026, 8, 14, 12),
      new Date(2026, 8, 21, 12),
      new Date(2026, 10, 2, 12),
    ];
    expect(maiorSequenciaDeSemanas(datas.map((d) => sessao(d)))).toBe(3);
  });

  it("vários treinos na mesma semana contam uma vez; sem treinos é zero", () => {
    expect(maiorSequenciaDeSemanas([sessao(new Date(2026, 10, 2, 8)), sessao(new Date(2026, 10, 3, 8))])).toBe(1);
    expect(maiorSequenciaDeSemanas([])).toBe(0);
  });
});

describe("conquistas", () => {
  const achar = (sessoes: Sessao[], id: string) => calcularConquistas(sessoes).find((c) => c.id === id);

  it("sem treinos, nenhuma foi obtida", () => {
    expect(calcularConquistas([]).filter((c) => c.obtida)).toEqual([]);
  });

  it("a primeira vem com o primeiro treino, com progresso real nas demais", () => {
    const sessoes = [sessao(new Date(2026, 10, 2, 8))];
    expect(achar(sessoes, "primeiro-treino")?.obtida).toBe(true);
    expect(achar(sessoes, "10-treinos")).toMatchObject({ atual: 1, alvo: 10, obtida: false });
  });

  it("sessão não finalizada não conta", () => {
    const aberta = { ...sessao(new Date(2026, 10, 2, 8)), finalizadaEm: null };
    expect(achar([aberta], "primeiro-treino")?.obtida).toBe(false);
  });

  it("recorde exige superar: a primeira vez não conta", () => {
    const uma = [sessao(new Date(2026, 10, 1, 8), [serie(50, 10)])];
    expect(achar(uma, "primeiro-recorde")?.obtida).toBe(false);
    const duas = [...uma, sessao(new Date(2026, 10, 2, 8), [serie(55, 10)])];
    expect(achar(duas, "primeiro-recorde")?.obtida).toBe(true);
  });

  it("toneladas usam o volume real", () => {
    expect(achar([sessao(new Date(2026, 10, 2, 8), [serie(1000, 10)])], "10-toneladas")?.obtida).toBe(true);
    expect(achar([sessao(new Date(2026, 10, 2, 8), [serie(999, 10)])], "10-toneladas")?.obtida).toBe(false);
  });
});

describe("metas", () => {
  const meta = (parcial: Partial<Meta>): Meta => ({
    id: "m",
    tipo: "treinos_mes",
    alvo: 4,
    exercicioNome: null,
    ...parcial,
  });

  it("treinos no mês não contam o mês anterior", () => {
    const sessoes = [sessao(new Date(2026, 10, 2, 8)), sessao(new Date(2026, 9, 30, 8))];
    expect(progressoDaMeta(meta({}), sessoes, AGORA)).toMatchObject({ atual: 1, percentual: 25, concluida: false });
  });

  it("volume no mês soma carga × repetições", () => {
    const sessoes = [sessao(new Date(2026, 10, 2, 8), [serie(100, 5)])];
    expect(progressoDaMeta(meta({ tipo: "volume_mes", alvo: 1000 }), sessoes, AGORA)).toMatchObject({
      atual: 500,
      percentual: 50,
    });
  });

  it("carga usa a melhor do exercício, e passar do alvo trava em 100%", () => {
    const sessoes = [sessao(new Date(2026, 5, 2, 8), [serie(120, 5)])];
    expect(
      progressoDaMeta(meta({ tipo: "carga", alvo: 100, exercicioNome: "Supino" }), sessoes, AGORA),
    ).toMatchObject({ atual: 120, percentual: 100, concluida: true });
  });

  it("exercício nunca feito fica em zero", () => {
    expect(progressoDaMeta(meta({ tipo: "carga", exercicioNome: "Outro" }), [], AGORA).atual).toBe(0);
  });
});

describe("exportação", () => {
  const dia = new Date(2026, 10, 2, 8);
  const linhas = (csv: string) => csv.replace(/^\uFEFF/, "").trim().split("\r\n");

  it("uma linha por série, com vírgula decimal e separador do Excel em português", () => {
    const csv = historicoEmCsv([sessao(dia, [serie(62.5, 8), serie(60, null)])]);
    const [cabecalho, primeira, segunda] = linhas(csv);
    expect(cabecalho.startsWith("Data;Treino;Exercício;Série;Peso (kg)")).toBe(true);
    expect(primeira).toBe("02/11/2026;Peito;Supino;1;62,5;8;;;");
    expect(segunda).toBe("02/11/2026;Peito;Supino;2;60;;;;");
  });

  it("marca o arquivo para o Excel reconhecer acentos", () => {
    expect(historicoEmCsv([]).charCodeAt(0)).toBe(0xfeff);
  });

  it("escapa separador, aspas e quebra de linha", () => {
    const csv = historicoEmCsv([sessao(dia, [serie(50, 10)], "Supino", 'pegada; "fechada"\nlenta')]);
    expect(csv).toContain('"pegada; ""fechada""\nlenta"');
  });

  it.each(["=2+2", "+cmd", "-1", "@soma"])("neutraliza %s como fórmula do Excel", (nome) => {
    const csv = historicoEmCsv([sessao(dia, [serie(50, 10)], nome)]);
    expect(linhas(csv)[1].split(";")[2]).toBe(`'${nome}`);
  });

  it("não exporta sessão em andamento", () => {
    const aberta = { ...sessao(dia), finalizadaEm: null };
    expect(linhas(historicoEmCsv([aberta]))).toHaveLength(1);
  });

  it("relatório resume cada exercício", () => {
    const csv = relatorioPorExercicioEmCsv([
      sessao(new Date(2026, 10, 1, 8), [serie(50, 10)]),
      sessao(new Date(2026, 10, 2, 8), [serie(70, 5)]),
    ]);
    expect(linhas(csv)[1]).toBe("Supino;2;70;02/11/2026;02/11/2026");
  });

  it("o texto de compartilhar não inclui campos desconhecidos", () => {
    const texto = textoParaCompartilhar(sessao(dia), {
      duracaoSeg: null,
      exercicios: 1,
      series: 1,
      volumeKg: 0,
      seriesSemReps: 1,
      recordes: [],
    });
    expect(texto).toContain("1 série");
    expect(texto).not.toContain("min");
    expect(texto).not.toContain(" kg");
  });

  it("o texto de compartilhar traz volume e recordes", () => {
    const texto = textoParaCompartilhar(sessao(dia), {
      duracaoSeg: 3600,
      exercicios: 1,
      series: 2,
      volumeKg: 400,
      seriesSemReps: 0,
      recordes: [{ nome: "Supino", peso: 62.5, anterior: 60 }],
    });
    expect(texto).toContain("2 séries · 400 kg · 1 h");
    expect(texto).toContain("Novo recorde: Supino, 62,5 kg");
  });
});
