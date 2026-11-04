import type { ExercicioCatalogo, ExercicioNoTreino } from "@/types/catalogo";
import { exercicioParaTreino, type AjustesExercicio } from "./catalogo";
import type { TreinoInput } from "./schemas";

/** Exercício do modelo: ID do catálogo e, se preciso, séries, repetições e descanso próprios. */
type ItemModelo = string | [string, AjustesExercicio];

interface FichaModelo {
  nome: string;
  dias: string[];
  itens: ItemModelo[];
}

export interface ModeloTreino {
  id: string;
  nome: string;
  frequencia: string;
  descricao: string;
  fichas: FichaModelo[];
}

// Principais vêm antes, com mais descanso. A carga fica vazia: quem sabe é a pessoa.
const principal = (id: string, reps = 10): ItemModelo => [id, { series: 4, repsAlvo: reps, descanso: 90 }];
const isolado = (id: string): ItemModelo => [id, { series: 3, repsAlvo: 12, descanso: 60 }];
const PRANCHA: ItemModelo = ["Plank", { series: 3, medida: "tempo", duracaoAlvoSeg: 45, descanso: 45 }];

export const MODELOS_TREINO: ModeloTreino[] = [
  {
    id: "corpo-inteiro",
    nome: "Corpo inteiro",
    frequencia: "3 vezes por semana",
    descricao: "Uma ficha só, repetida em dias alternados. Boa para voltar a treinar.",
    fichas: [
      {
        nome: "Corpo inteiro",
        dias: ["Segunda", "Quarta", "Sexta"],
        itens: [
          principal("Barbell_Full_Squat"),
          principal("Barbell_Bench_Press_-_Medium_Grip"),
          principal("Seated_Cable_Rows"),
          isolado("Dumbbell_Shoulder_Press"),
          isolado("Lying_Leg_Curls"),
          isolado("Barbell_Curl"),
          isolado("Triceps_Pushdown"),
          PRANCHA,
        ],
      },
    ],
  },
  {
    id: "ab-superior-inferior",
    nome: "AB: superior e inferior",
    frequencia: "4 vezes por semana",
    descricao: "Parte de cima em um dia e pernas no outro.",
    fichas: [
      {
        nome: "Treino A - Superior",
        dias: ["Segunda", "Quinta"],
        itens: [
          principal("Barbell_Bench_Press_-_Medium_Grip"),
          principal("Wide-Grip_Lat_Pulldown"),
          isolado("Incline_Dumbbell_Press"),
          isolado("Seated_Cable_Rows"),
          isolado("Side_Lateral_Raise"),
          isolado("Barbell_Curl"),
          isolado("Triceps_Pushdown"),
        ],
      },
      {
        nome: "Treino B - Inferior",
        dias: ["Terça", "Sexta"],
        itens: [
          principal("Barbell_Full_Squat"),
          principal("Leg_Press"),
          isolado("Lying_Leg_Curls"),
          isolado("Leg_Extensions"),
          isolado("Barbell_Hip_Thrust"),
          isolado("Standing_Calf_Raises"),
          PRANCHA,
        ],
      },
    ],
  },
  {
    id: "abc",
    nome: "ABC",
    frequencia: "3 vezes por semana",
    descricao: "A divisão clássica: empurrar, puxar e pernas.",
    fichas: [
      {
        nome: "Treino A - Peito, ombro e tríceps",
        dias: ["Segunda"],
        itens: [
          principal("Barbell_Bench_Press_-_Medium_Grip"),
          principal("Incline_Dumbbell_Press"),
          isolado("Butterfly"),
          isolado("Dumbbell_Shoulder_Press"),
          isolado("Side_Lateral_Raise"),
          isolado("Triceps_Pushdown"),
          isolado("EZ-Bar_Skullcrusher"),
        ],
      },
      {
        nome: "Treino B - Costas e bíceps",
        dias: ["Quarta"],
        itens: [
          principal("Wide-Grip_Lat_Pulldown"),
          principal("Seated_Cable_Rows"),
          isolado("One-Arm_Dumbbell_Row"),
          isolado("Reverse_Machine_Flyes"),
          isolado("Barbell_Curl"),
          isolado("Hammer_Curls"),
        ],
      },
      {
        nome: "Treino C - Pernas",
        dias: ["Sexta"],
        itens: [
          principal("Barbell_Full_Squat"),
          principal("Leg_Press"),
          isolado("Leg_Extensions"),
          isolado("Lying_Leg_Curls"),
          isolado("Standing_Calf_Raises"),
          PRANCHA,
        ],
      },
    ],
  },
  {
    id: "abcd",
    nome: "ABCD",
    frequencia: "4 vezes por semana",
    descricao: "Mais volume por grupo muscular, com um dia só para ombros.",
    fichas: [
      {
        nome: "Treino A - Peito e tríceps",
        dias: ["Segunda"],
        itens: [
          principal("Barbell_Bench_Press_-_Medium_Grip"),
          principal("Incline_Dumbbell_Press"),
          isolado("Butterfly"),
          isolado("Triceps_Pushdown"),
          isolado("Cable_Rope_Overhead_Triceps_Extension"),
        ],
      },
      {
        nome: "Treino B - Costas e bíceps",
        dias: ["Terça"],
        itens: [
          principal("Wide-Grip_Lat_Pulldown"),
          principal("Bent_Over_Barbell_Row"),
          isolado("Seated_Cable_Rows"),
          isolado("Barbell_Curl"),
          isolado("Hammer_Curls"),
        ],
      },
      {
        nome: "Treino C - Pernas",
        dias: ["Quinta"],
        itens: [
          principal("Barbell_Full_Squat"),
          principal("Leg_Press"),
          isolado("Romanian_Deadlift"),
          isolado("Leg_Extensions"),
          isolado("Lying_Leg_Curls"),
          isolado("Standing_Calf_Raises"),
        ],
      },
      {
        nome: "Treino D - Ombros e abdômen",
        dias: ["Sexta"],
        itens: [
          principal("Dumbbell_Shoulder_Press"),
          isolado("Side_Lateral_Raise"),
          isolado("Front_Dumbbell_Raise"),
          isolado("Reverse_Machine_Flyes"),
          isolado("Barbell_Shrug"),
          PRANCHA,
          isolado("Crunches"),
        ],
      },
    ],
  },
];

const idDoItem = (item: ItemModelo) => (typeof item === "string" ? item : item[0]);

/** IDs que precisam existir no catálogo. Conferido por teste. */
export const idsDosModelos = (): string[] =>
  MODELOS_TREINO.flatMap((m) => m.fichas.flatMap((f) => f.itens.map(idDoItem)));

/** Um treino para cada ficha, pronto para salvar. A pessoa ajusta tudo depois. */
export function montarTreinosDoModelo(modelo: ModeloTreino, catalogo: ExercicioCatalogo[]): TreinoInput[] {
  return modelo.fichas.map((ficha) => {
    const exercicios = ficha.itens.flatMap((item, ordem): ExercicioNoTreino[] => {
      const catalogado = catalogo.find((e) => e.id === idDoItem(item));
      if (!catalogado) return [];
      return [exercicioParaTreino(catalogado, ordem, typeof item === "string" ? {} : item[1])];
    });
    return { nome: ficha.nome, descricao: "", dias: ficha.dias, exercicios };
  });
}

/** Nomes do catálogo, para mostrar a ficha antes de usar. */
export function nomesDaFicha(ficha: FichaModelo, catalogo: ExercicioCatalogo[]): string[] {
  return ficha.itens.flatMap((item) => {
    const catalogado = catalogo.find((e) => e.id === idDoItem(item));
    return catalogado ? [catalogado.name] : [];
  });
}
