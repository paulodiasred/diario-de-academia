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
  /** Exercício criado pelo usuário. */
  proprio?: boolean;
  medida?: TipoMedida;
}

/** Como uma série é medida. Treinos antigos não têm o campo: veja `medidaDoExercicio`. */
export type TipoMedida = "carga_reps" | "peso_corporal" | "tempo" | "distancia";

export const MEDIDA_LABEL: Record<TipoMedida, string> = {
  carga_reps: "Carga e repetições",
  peso_corporal: "Peso corporal",
  tempo: "Tempo",
  distancia: "Distância",
};

export function medidaPadraoDoCatalogo(
  ex: Pick<ExercicioCatalogo, "category" | "equipment" | "medida">,
): TipoMedida {
  if (ex.medida) return ex.medida;
  if (ex.category === "cardio" || ex.category === "stretching") return "tempo";
  if (ex.equipment === "body only") return "peso_corporal";
  return "carga_reps";
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
  medida?: TipoMedida;
  repsAlvo?: number;
  cargaAlvo?: number;
  duracaoAlvoSeg?: number;
  distanciaAlvoM?: number;
  circuito?: string[];
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
