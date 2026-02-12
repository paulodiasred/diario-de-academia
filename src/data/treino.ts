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

export interface ExercicioInstanciado {
  id: string;
  dia: string;
  grupo: string;
  exercicio: string;
  tipo: "Força" | "Circuito" | "Cardio";

  // opcionais
  descanso?: number;
  series?: number;
  circuito?: string[];
}


// =======================
// REGISTRO FIREBASE
// =======================

export interface TreinoRegistro {
  id?: string;
  userId: string;
  exercicioId: string; // 🔥 ESSENCIAL
  exercicioNome: string;
  peso: number;
  serie: number;
  dia: string;
  data: string;
  concluida?: boolean;
}

export const treino: Exercicio[] = [
  // ==================
  // SEGUNDA — Peito FORÇA + Tríceps + Cardio
  // ==================
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Supino barra",
    tipo: "Força",
    descanso: 120,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Supino inclinado halteres",
    tipo: "Força",
    descanso: 90,
    series: 4,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Crossover baixo",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Crucifixo (pausa 2s no centro)",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Segunda",
    grupo: "Tríceps",
    exercicio: "Polia reta",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Segunda",
    grupo: "Tríceps",
    exercicio: "Corda",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Segunda",
    grupo: "Peito pesado",
    exercicio: "Flexão (finalizador: até falha + segurar embaixo 10s)",
    tipo: "Força",
    descanso: 0,
    series: 1,
  },
  {
    dia: "Segunda",
    grupo: "Cardio",
    exercicio: "Caminhada inclinada (20 min)",
    tipo: "Cardio",
  },

  // ==================
  // TERÇA — Costas + Bíceps + Cardio
  // ==================
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
    exercicio: "Remada baixa",
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
    series: 3,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Crucifixo invertido",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
  {
    dia: "Terça",
    grupo: "Costas",
    exercicio: "Encolhimento halteres",
    tipo: "Força",
    descanso: 60,
    series: 3,
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
    series: 3,
  },
  {
    dia: "Terça",
    grupo: "Bíceps",
    exercicio: "Martelo",
    tipo: "Força",
    descanso: 50,
    series: 3,
  },
  {
    dia: "Terça",
    grupo: "Cardio",
    exercicio: "Caminhada inclinada (20 min)",
    tipo: "Cardio",
  },

  // ==================
  // QUARTA — Perna (+ cardio opcional)
  // ==================
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
    exercicio: "Stiff",
    tipo: "Força",
    descanso: 75,
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
    exercicio: "Cadeira flexora",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Cadeira extensora",
    tipo: "Força",
    descanso: 75,
    series: 3,
  },
  {
    dia: "Quarta",
    grupo: "Perna",
    exercicio: "Abdutor",
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
  {
    dia: "Quarta",
    grupo: "Cardio",
    exercicio: "Caminhada inclinada (15–20 min) — opcional",
    tipo: "Cardio",
  },

  // ==================
  // QUINTA — Ombro + Core + Cardio
  // ==================
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Aquecimento em circuito",
    tipo: "Circuito",
    descanso: 40,
    series: 3,
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
    exercicio: "Peck deck invertido",
    tipo: "Força",
    descanso: 50,
    series: 3,
  },
  {
    dia: "Quinta",
    grupo: "Ombro",
    exercicio: "Crucifixo invertido banco",
    tipo: "Força",
    descanso: 50,
    series: 3,
  },
  {
    dia: "Quinta",
    grupo: "Core",
    exercicio: "Prancha",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Quinta",
    grupo: "Core",
    exercicio: "Abdominal infra",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Quinta",
    grupo: "Cardio",
    exercicio: "Caminhada inclinada (20 min)",
    tipo: "Cardio",
  },

  // ==================
  // SEXTA — Peito VOLUME + Cardio
  // ==================
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Supino reto",
    tipo: "Força",
    descanso: 60,
    series: 3,
  },
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Crucifixo",
    tipo: "Força",
    descanso: 45,
    series: 4,
  },
  {
    dia: "Sexta",
    grupo: "Peito isolado",
    exercicio: "Crossover",
    tipo: "Força",
    descanso: 40,
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
    grupo: "Peito isolado",
    exercicio: "Flexão lenta (finalizador: até falha)",
    tipo: "Força",
    descanso: 0,
    series: 1,
  },
  {
    dia: "Sexta",
    grupo: "Cardio",
    exercicio: "Caminhada inclinada (20 min)",
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
  Core: "🧠",
  Cardio: "❤️",
};


// =======================
// 🔥 GERADOR DE TREINO COM ID POR DIA
// =======================

export const gerarTreinoComId = (dia: string): ExercicioInstanciado[] => {
  const hoje = new Date().toISOString().split("T")[0];

  return treino
    .filter(e => e.dia === dia)
    .map(e => ({
      id: `${e.exercicio}-${dia}-${hoje}`,
      dia: e.dia,
      grupo: e.grupo,
      exercicio: e.exercicio,
      tipo: e.tipo,
      descanso: "descanso" in e ? e.descanso : undefined,
      series: "series" in e ? e.series : undefined,
      circuito: "circuito" in e ? e.circuito : undefined,
    }));
};
