import { describe, expect, it } from "vitest";
import type { TreinoPersonalizado } from "@/types/catalogo";
import {
  diasDaSemanaAtual,
  exerciciosTreinados,
  pontosRmEstimado,
  proximoDaSequencia,
  recordesBatidos,
  recordesRecentes,
  rmEstimado,
  seriesPorGrupo,
  sugerirTreino,
} from "./estatisticas";
import type { ExercicioSessao, SerieSessao, Sessao } from "./sessao";
import { formatarVolume } from "./texto";

// Uma quinta-feira.
const AGORA = new Date(2026, 10, 5, 18, 0);
const diasAtras = (n: number) => new Date(2026, 10, 5 - n, 18, 0).toISOString();

const serie = (peso: number | null, reps: number | null): SerieSessao => ({
  peso,
  reps,
  duracaoSeg: null,
  distanciaM: null,
  concluida: true,
  concluidaEm: null,
  editada: false,
});

const exercicio = (parcial: Partial<ExercicioSessao> & { series: SerieSessao[] }): ExercicioSessao => ({
  exercicioId: "supino",
  nome: "Supino",
  medida: "carga_reps",
  descanso: 60,
  primaryMuscles: ["chest"],
  notas: "",
  ...parcial,
});

function sessao(id: string, quando: string, exercicios: ExercicioSessao[], treinoId: string | null = null): Sessao {
  return {
    id,
    treinoId,
    nome: "Treino",
    iniciadaEm: quando,
    finalizadaEm: quando,
    origem: "app",
    notas: "",
    exercicios,
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: quando,
  };
}

const treino = (id: string, nome: string, dias: string[] = []) =>
  ({ id, nome, dias, exercicios: [] }) as unknown as TreinoPersonalizado;

describe("rmEstimado", () => {
  it("segue a fórmula de Epley", () => {
    expect(rmEstimado(100, 10)).toBe(133.3);
    expect(rmEstimado(80, 5)).toBe(93.3);
  });

  it("uma repetição é a própria carga", () => {
    expect(rmEstimado(100, 1)).toBe(100);
  });

  it("não estima o que não dá para estimar", () => {
    expect(rmEstimado(100, 13)).toBeNull();
    expect(rmEstimado(0, 10)).toBeNull();
    expect(rmEstimado(null, 10)).toBeNull();
    expect(rmEstimado(100, null)).toBeNull();
    expect(rmEstimado(100, 0)).toBeNull();
  });

  it("corrige o caso em que 80 × 10 é mais forte que 100 × 1", () => {
    expect(rmEstimado(80, 10)!).toBeGreaterThan(rmEstimado(100, 1)!);
  });
});

describe("pontosRmEstimado", () => {
  it("o melhor de cada treino, em ordem cronológica", () => {
    const pontos = pontosRmEstimado(
      [
        sessao("b", diasAtras(1), [exercicio({ series: [serie(100, 5), serie(100, 3)] })]),
        sessao("a", diasAtras(8), [exercicio({ series: [serie(90, 5)] })]),
      ],
      "supino",
      "Supino",
    );
    expect(pontos.map((p) => p.valor)).toEqual([105, 116.7]);
  });

  it("registro antigo sem repetições fica de fora, sem inventar", () => {
    const pontos = pontosRmEstimado([sessao("a", diasAtras(1), [exercicio({ series: [serie(90, null)] })])], "supino", "Supino");
    expect(pontos).toEqual([]);
  });
});

describe("recordesRecentes", () => {
  it("carga e repetições juntos, do mais recente ao mais antigo", () => {
    const flexao = (reps: number) =>
      exercicio({ exercicioId: "flexao", nome: "Flexão", medida: "peso_corporal", series: [serie(null, reps)] });
    const lista = recordesRecentes([
      sessao("a", diasAtras(10), [exercicio({ series: [serie(50, 10)] }), flexao(10)]),
      sessao("b", diasAtras(5), [exercicio({ series: [serie(60, 10)] })]),
      sessao("c", diasAtras(1), [flexao(15)]),
    ]);
    expect(lista.map((r) => [r.nome, r.valor, r.anterior])).toEqual([
      ["Flexão", "15 reps", "10 reps"],
      ["Supino", "60 kg", "50 kg"],
    ]);
  });

  it("a primeira vez e o empate não são recorde de repetições", () => {
    const flexao = (reps: number) =>
      exercicio({ nome: "Flexão", medida: "peso_corporal", series: [serie(0, reps)] });
    expect(recordesRecentes([sessao("a", diasAtras(2), [flexao(10)]), sessao("b", diasAtras(1), [flexao(10)])])).toEqual([]);
  });

  it("flexão com carga extra conta como carga, não como repetições", () => {
    const comCarga = (peso: number, reps: number) =>
      exercicio({ nome: "Flexão", medida: "peso_corporal", series: [serie(peso, reps)] });
    const lista = recordesRecentes([sessao("a", diasAtras(2), [comCarga(10, 20)]), sessao("b", diasAtras(1), [comCarga(15, 8)])]);
    expect(lista.map((r) => r.valor)).toEqual(["15 kg"]);
  });
});

describe("seriesPorGrupo", () => {
  it("soma por grupo, do mais treinado ao menos treinado", () => {
    const lista = seriesPorGrupo(
      [
        sessao("a", diasAtras(1), [
          exercicio({ series: [serie(50, 10), serie(50, 10)] }),
          exercicio({ exercicioId: "remada", primaryMuscles: ["lats"], series: [serie(40, 10)] }),
          exercicio({ exercicioId: "serrote", primaryMuscles: ["middle back"], series: [serie(20, 10), serie(20, 10)] }),
        ]),
      ],
      7,
      AGORA,
    );
    expect(lista.map((g) => [g.rotulo, g.series])).toEqual([
      ["Costas", 3],
      ["Peito", 2],
    ]);
  });

  it("só conta dentro do período", () => {
    const lista = seriesPorGrupo([sessao("a", diasAtras(20), [exercicio({ series: [serie(50, 10)] })])], 7, AGORA);
    expect(lista).toEqual([]);
  });

  it("sem músculo informado vai para Outros, sem palpite", () => {
    const lista = seriesPorGrupo([sessao("a", diasAtras(1), [exercicio({ primaryMuscles: [], series: [serie(50, 10)] })])], 7, AGORA);
    expect(lista).toEqual([{ id: "outros", rotulo: "Outros", series: 1 }]);
  });
});

describe("sugestão de treino", () => {
  const ficha = [treino("c", "Treino C"), treino("a", "Treino A"), treino("b", "Treino B")];

  it("sem histórico, começa pelo primeiro da ficha", () => {
    expect(proximoDaSequencia(ficha, [])?.nome).toBe("Treino A");
  });

  it("segue a sequência e volta ao início", () => {
    const feito = (id: string, dias: number) => sessao(id, diasAtras(dias), [], id);
    expect(proximoDaSequencia(ficha, [feito("a", 1)])?.nome).toBe("Treino B");
    expect(proximoDaSequencia(ficha, [feito("a", 3), feito("b", 1)])?.nome).toBe("Treino C");
    expect(proximoDaSequencia(ficha, [feito("c", 1), feito("a", 5)])?.nome).toBe("Treino A");
  });

  it("treino excluído não trava a sequência", () => {
    const antigo = sessao("x", diasAtras(1), [], "apagado");
    const valido = sessao("y", diasAtras(4), [], "a");
    expect(proximoDaSequencia(ficha, [antigo, valido])?.nome).toBe("Treino B");
  });

  it("10 vem depois de 9", () => {
    const lista = [treino("d", "Treino 10"), treino("n", "Treino 9")];
    expect(proximoDaSequencia(lista, [])?.nome).toBe("Treino 9");
  });

  it("agenda tem prioridade; sem agenda, a sequência", () => {
    expect(sugerirTreino([treino("a", "A", ["Quinta"])], [], AGORA)?.contexto).toBe("Próximo treino · Hoje");
    expect(sugerirTreino([treino("a", "A", ["Sexta"])], [], AGORA)?.contexto).toBe("Próximo treino · Amanhã");
    expect(sugerirTreino(ficha, [], AGORA)?.contexto).toBe("Próximo da sua sequência");
  });

  it("sem treinos, não há sugestão", () => {
    expect(sugerirTreino([], [], AGORA)).toBeNull();
  });
});

describe("diasDaSemanaAtual", () => {
  it("de segunda a domingo, com feito, previsto e hoje", () => {
    const dias = diasDaSemanaAtual(
      [treino("a", "A", ["Segunda", "Sexta"])],
      [sessao("s", diasAtras(1), [])],
      AGORA,
    );
    expect(dias.map((d) => d.nome)).toEqual(["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]);
    expect(dias.filter((d) => d.feito).map((d) => d.nome)).toEqual(["Quarta"]);
    expect(dias.filter((d) => d.previsto).map((d) => d.nome)).toEqual(["Segunda", "Sexta"]);
    expect(dias.filter((d) => d.hoje).map((d) => d.nome)).toEqual(["Quinta"]);
  });
});

describe("formatarVolume", () => {
  it("usa toneladas só quando não caberia", () => {
    expect(formatarVolume(13_825)).toBe("13.825 kg");
    expect(formatarVolume(99_999)).toBe("99.999 kg");
    expect(formatarVolume(153_600)).toBe("153,6 t");
    expect(formatarVolume(1_536_000)).toBe("1.536 t");
  });
});

describe("exercício renomeado continua sendo o mesmo", () => {
  const com = (id: string, nome: string, peso: number) => exercicio({ exercicioId: id, nome, series: [serie(peso, 10)] });

  it("não vira duas linhas: fica o nome mais recente e a soma de tudo", () => {
    const lista = exerciciosTreinados([
      sessao("a", diasAtras(10), [com("Lying_Leg_Curls", "Cadeira Flexora", 40)]),
      sessao("b", diasAtras(1), [com("Lying_Leg_Curls", "Mesa Flexora", 35)]),
    ]);
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ nome: "Mesa Flexora", vezes: 2, melhorPeso: 40, nomes: ["Cadeira Flexora", "Mesa Flexora"] });
  });

  it("o recorde compara com o nome antigo, sem recomeçar do zero", () => {
    const sessoes = [
      sessao("a", diasAtras(10), [com("x", "Nome antigo", 40)]),
      sessao("b", diasAtras(5), [com("x", "Nome novo", 35)]),
      sessao("c", diasAtras(1), [com("x", "Nome novo", 45)]),
    ];
    expect(recordesBatidos(sessoes).map((r) => [r.peso, r.anterior])).toEqual([[45, 40]]);
  });

  it("registro antigo, ligado só pelo nome, entra em cadeia", () => {
    const lista = exerciciosTreinados([
      sessao("a", diasAtras(10), [com("nome-supino", "Supino", 40)]),
      sessao("b", diasAtras(5), [com("catalogo", "Supino", 45)]),
      sessao("c", diasAtras(1), [com("catalogo", "Supino Reto", 50)]),
    ]);
    expect(lista).toHaveLength(1);
    expect(lista[0].vezes).toBe(3);
  });

  it("exercícios diferentes continuam separados", () => {
    const lista = exerciciosTreinados([sessao("a", diasAtras(2), [com("a", "Supino", 40), com("b", "Rosca", 20)])]);
    expect(lista.map((e) => e.nome).sort()).toEqual(["Rosca", "Supino"]);
  });

  it("registro sem ID não junta exercícios diferentes", () => {
    const lista = exerciciosTreinados([sessao("a", diasAtras(2), [com("", "Supino", 40), com("", "Rosca", 20)])]);
    expect(lista).toHaveLength(2);
  });
});
