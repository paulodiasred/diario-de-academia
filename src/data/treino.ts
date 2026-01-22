type TipoExercicio = "Força" | "Circuito" | "Cardio";

export interface ExercicioBase {
  dia: string;
  grupo: string;
  exercicio: string;
  tipo: TipoExercicio;
}
interface ExercicioForca extends ExercicioBase {
  descanso: number; // em segundos
  series: number;
  tipo: "Força";
}

interface ExercicioCircuito extends ExercicioBase {
  series: number;
  descanso: number;
  tipo: "Circuito";
  circuito: string[]; // lista de exercícios no circuito
}

interface ExercicioCardio extends ExercicioBase {
  tipo: "Cardio";
}

export interface TreinoRegistro {
  id?: string;
  userId: string;
  exercicio: string;
  peso: number;
  serie: number;
  dia: string;
  data: string;
  concluida?: boolean;
}

export type Exercicio = ExercicioForca | ExercicioCircuito | ExercicioCardio;


export const treino: Exercicio[] = [
  // SEGUNDA
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Supino inclinado halteres",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Supino reto halteres",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Crucifixo",
    tipo: "Força",
    descanso: 50,
    series: 5,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Pullover",
    tipo: "Força",
    descanso: 60,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Crossover inclinação baixa",
    tipo: "Força",
    descanso: 45,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Tríceps",
    exercicio: "Polia reta",
    tipo: "Força",
    descanso: 50,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Tríceps",
    exercicio: "Corda",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Segunda",
    grupo: "Cardio",
    exercicio: "Cardio (25–30 min)",
    tipo: "Cardio",
  },

  // TERÇA
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Pulley frente",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Pulley triângulo",
    tipo: "Força",
    descanso: 70,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Remada unilateral",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Remada baixa",
    tipo: "Força",
    descanso: 70,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Encolhimento halteres",
    tipo: "Força",
    descanso: 60,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Crucifixo invertido polia",
    tipo: "Força",
    descanso: 45,
    series: 6,
  },
  {
    dia: "Terça",
    grupo: "Bíceps",
    exercicio: "Barra W",
    tipo: "Força",
    descanso: 60,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Bíceps",
    exercicio: "Alternado",
    tipo: "Força",
    descanso: 50,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Bíceps",
    exercicio: "Martelo",
    tipo: "Força",
    descanso: 50,
    series: 4,
  },
  {
    dia: "Terça",
    grupo: "Cardio",
    exercicio: "Cardio (25–30 min)",
    tipo: "Cardio",
  },

  // QUARTA
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Leg press",
    tipo: "Força",
    descanso: 90,
    series: 4,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Cadeira extensora",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Mesa flexora",
    tipo: "Força",
    descanso: 60,
    series: 4,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Agachamento sumô",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Abdutores",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Adutores",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Panturrilha",
    tipo: "Força",
    descanso: 35,
    series: 4,
  },

  // QUINTA
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Aquecimento em circuito",
    tipo: "Circuito",
    descanso: 40,
    series: 4,
    circuito: [
      "Elevação lateral",
      "Elevação frontal",
      "Elevação frontal pegada supinada",
    ],
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Desenvolvimento ombro com halteres",
    tipo: "Força",
    descanso: 75,
    series: 4,
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Elevação lateral",
    tipo: "Força",
    descanso: 45,
    series: 4,
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Elevação frontal",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Crucifixo invertido banco",
    tipo: "Força",
    descanso: 50,
    series: 4,
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Peck deck invertido",
    tipo: "Força",
    descanso: 50,
    series: 4,
  },
  {
    dia: "Quinta",
    grupo: "Cardio",
    exercicio: "Cardio (25–30 min)",
    tipo: "Cardio",
  },

  // SEXTA
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Crossover",
    tipo: "Força",
    descanso: 40,
    series: 3,
  },
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Crucifixo",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Supino reto",
    tipo: "Força",
    descanso: 60,
    series: 4,
  },
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Pullover",
    tipo: "Força",
    descanso: 50,
    series: 3,
  },
  {
    dia: "Sexta",
    grupo: "Cardio",
    exercicio: "Cardio (25–30 min)",
    tipo: "Cardio",
  },
];

export const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const;

export const grupoIcons: Record<string, string> = {
  "Peito pesado": "💪",
  "Peito isolado": "💪",
  Tríceps: "💪",
  Costas: "🏋️",
  Bíceps: "💪",
  Perna: "🦵",
  Ombro: "🎯",
  Cardio: "❤️",
};
