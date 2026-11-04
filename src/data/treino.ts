// Treino fixo antigo. Só é usado para converter em rotinas as contas que já registraram séries nele.
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

/** Documento da coleção `registros`: uma série registrada. */
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
  // ==================
  // SEGUNDA — Peito FORÇA + Tríceps
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
    exercicio: "Peck deck",
    tipo: "Força",
    descanso: 45,
    series: 2,
  },

  // ==================
  // TERÇA — Costas + Bíceps
  // OTIMIZADO PRA 1H
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
    exercicio: "Martelo",
    tipo: "Força",
    descanso: 50,
    series: 3,
  },

  // ==================
  // QUARTA — PERNA
  // MAIS EFICIENTE
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
    exercicio: "Panturrilha",
    tipo: "Força",
    descanso: 35,
    series: 4,
  },

  // ==================
  // QUINTA — Ombro + Core
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

  // ==================
  // SEXTA — Peito VOLUME
  // MAIS LIMPO
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
    exercicio: "Chest press máquina",
    tipo: "Força",
    descanso: 45,
    series: 3,
  },
];
