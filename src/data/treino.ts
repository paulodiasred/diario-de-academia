export interface Exercicio {
  dia: string;
  grupo: string;
  exercicio: string;
  descanso: number;
}

export interface TreinoRegistro {
  id?: string;
  exercicio: string;
  peso: number;
  serie: number;
  dia: string;
  data: string;
  concluida?: boolean;
}

export const treino: Exercicio[] = [
  // SEGUNDA
  { dia: "Segunda", grupo: "Peito pesado", exercicio: "Supino inclinado halteres", descanso: 75 },
  { dia: "Segunda", grupo: "Peito pesado", exercicio: "Supino reto halteres", descanso: 75 },
  { dia: "Segunda", grupo: "Peito pesado", exercicio: "Crucifixo", descanso: 50 },
  { dia: "Segunda", grupo: "Peito pesado", exercicio: "Pullover", descanso: 60 },
  { dia: "Segunda", grupo: "Peito pesado", exercicio: "Crossover inclinação baixa", descanso: 45 },
  { dia: "Segunda", grupo: "Tríceps", exercicio: "Polia reta", descanso: 50 },
  { dia: "Segunda", grupo: "Tríceps", exercicio: "Corda", descanso: 45 },
  { dia: "Segunda", grupo: "Cardio", exercicio: "Cardio (25–30 min)", descanso: 0 },

  // TERÇA
  { dia: "Terça", grupo: "Costas", exercicio: "Pulley frente", descanso: 75 },
  { dia: "Terça", grupo: "Costas", exercicio: "Pulley triângulo", descanso: 70 },
  { dia: "Terça", grupo: "Costas", exercicio: "Remada unilateral", descanso: 75 },
  { dia: "Terça", grupo: "Costas", exercicio: "Remada baixa", descanso: 70 },
  { dia: "Terça", grupo: "Costas", exercicio: "Encolhimento halteres", descanso: 60 },
  { dia: "Terça", grupo: "Costas", exercicio: "Crucifixo invertido polia", descanso: 45 },
  { dia: "Terça", grupo: "Bíceps", exercicio: "Barra W", descanso: 60 },
  { dia: "Terça", grupo: "Bíceps", exercicio: "Alternado", descanso: 50 },
  { dia: "Terça", grupo: "Bíceps", exercicio: "Martelo", descanso: 50 },
  { dia: "Terça", grupo: "Cardio", exercicio: "Cardio (25–30 min)", descanso: 0 },

  // QUARTA
  { dia: "Quarta", grupo: "Perna", exercicio: "Extensora", descanso: 60 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Leg press", descanso: 90 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Cadeira extensora", descanso: 75 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Mesa flexora", descanso: 60 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Agachamento sumô", descanso: 75 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Abdutores", descanso: 45 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Adutores", descanso: 45 },
  { dia: "Quarta", grupo: "Perna", exercicio: "Panturrilha", descanso: 35 },

  // QUINTA
  { dia: "Quinta", grupo: "Ombro", exercicio: "Aquecimento em circuito", descanso: 40 },
  { dia: "Quinta", grupo: "Ombro", exercicio: "Desenvolvimento", descanso: 75 },
  { dia: "Quinta", grupo: "Ombro", exercicio: "Elevação lateral", descanso: 45 },
  { dia: "Quinta", grupo: "Ombro", exercicio: "Elevação frontal", descanso: 45 },
  { dia: "Quinta", grupo: "Ombro", exercicio: "Crucifixo invertido banco", descanso: 50 },
  { dia: "Quinta", grupo: "Ombro", exercicio: "Peck deck invertido", descanso: 50 },
  { dia: "Quinta", grupo: "Cardio", exercicio: "Cardio (25–30 min)", descanso: 0 },

  // SEXTA
  { dia: "Sexta", grupo: "Peito isolado", exercicio: "Crossover", descanso: 40 },
  { dia: "Sexta", grupo: "Peito isolado", exercicio: "Crucifixo", descanso: 45 },
  { dia: "Sexta", grupo: "Peito isolado", exercicio: "Supino reto", descanso: 60 },
  { dia: "Sexta", grupo: "Peito isolado", exercicio: "Pullover", descanso: 50 },
  { dia: "Sexta", grupo: "Cardio", exercicio: "Cardio (25–30 min)", descanso: 0 },
];

export const dias = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"] as const;

export const grupoIcons: Record<string, string> = {
  "Peito pesado": "💪",
  "Peito isolado": "💪",
  "Tríceps": "💪",
  "Costas": "🏋️",
  "Bíceps": "💪",
  "Perna": "🦵",
  "Ombro": "🎯",
  "Cardio": "❤️",
};
