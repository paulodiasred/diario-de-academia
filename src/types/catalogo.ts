export interface ExercicioCatalogo {
  id: string;
  name: string;
  force: string | null;
  level: "beginner" | "intermediate" | "expert";
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface ExercicioNoTreino {
  exercicioId: string;
  exercicioNome: string;
  primaryMuscles: string[];
  category: string;
  series: number;
  descanso: number;
  ordem: number;
  images?: string[];
}

export interface TreinoPersonalizado {
  id?: string;
  userId: string;
  nome: string;
  descricao?: string;
  dias: string[];
  exercicios: ExercicioNoTreino[];
  criadoEm?: string;
  atualizadoEm?: string;
}

export const DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

export const NIVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  expert: "Avançado",
};

export const CATEGORIA_LABEL: Record<string, string> = {
  strength: "Força",
  cardio: "Cardio",
  stretching: "Alongamento",
  powerlifting: "Levantamento de peso",
  strongman: "Strongman",
  "olympic weightlifting": "Levantamento olímpico",
  plyometrics: "Pliometria",
};

export const MUSCULO_LABEL: Record<string, string> = {
  abdominals: "Abdominais",
  abductors: "Abdutores",
  adductors: "Adutores",
  biceps: "Bíceps",
  calves: "Panturrilhas",
  chest: "Peito",
  forearms: "Antebraços",
  glutes: "Glúteos",
  hamstrings: "Isquiotibiais",
  "hip flexors": "Flexores do quadril",
  lats: "Dorsais",
  "lower back": "Lombar",
  "middle back": "Costas médias",
  neck: "Pescoço",
  quadriceps: "Quadríceps",
  shoulders: "Ombros",
  traps: "Trapézio",
  triceps: "Tríceps",
};

export const EQUIPAMENTO_LABEL: Record<string, string> = {
  barbell: "Barra",
  dumbbell: "Haltere",
  "body only": "Peso corporal",
  machine: "Máquina",
  cable: "Cabo",
  kettlebells: "Kettlebell",
  bands: "Elástico",
  "medicine ball": "Bola medicinal",
  "exercise ball": "Bola de exercício",
  "foam roll": "Rolo de espuma",
  "e-z curl bar": "Barra W",
  other: "Outro",
};
