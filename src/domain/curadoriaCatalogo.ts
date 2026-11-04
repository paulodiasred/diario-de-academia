import type { ExercicioCatalogo } from "@/types/catalogo";

/**
 * Ajustes sobre o catálogo bruto, sem alterar o arquivo original nem os IDs.
 * Treinos e histórico guardam uma cópia do nome e continuam ligados pelo ID.
 */

/** Os mais usados nas academias, por grupo muscular. A ordem é a da lista inicial. */
export const EXERCICIOS_POPULARES: string[] = [
  // Peito
  "Barbell_Bench_Press_-_Medium_Grip",
  "Incline_Dumbbell_Press",
  "Dumbbell_Bench_Press",
  "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Butterfly",
  "Cable_Crossover",
  "Dumbbell_Flyes",
  "Machine_Bench_Press",
  "Pushups",
  // Costas
  "Wide-Grip_Lat_Pulldown",
  "Seated_Cable_Rows",
  "Bent_Over_Barbell_Row",
  "One-Arm_Dumbbell_Row",
  "V-Bar_Pulldown",
  "Pullups",
  "Barbell_Deadlift",
  "Straight-Arm_Pulldown",
  "Barbell_Shrug",
  // Ombros
  "Dumbbell_Shoulder_Press",
  "Side_Lateral_Raise",
  "Front_Dumbbell_Raise",
  "Machine_Shoulder_Military_Press",
  "Reverse_Machine_Flyes",
  "Face_Pull",
  "Upright_Barbell_Row",
  // Bíceps
  "Barbell_Curl",
  "Dumbbell_Alternate_Bicep_Curl",
  "Hammer_Curls",
  "Preacher_Curl",
  "Standing_Biceps_Cable_Curl",
  "Concentration_Curls",
  // Tríceps
  "Triceps_Pushdown",
  "Triceps_Pushdown_-_Rope_Attachment",
  "EZ-Bar_Skullcrusher",
  "Cable_Rope_Overhead_Triceps_Extension",
  "Seated_Triceps_Press",
  "Bench_Dips",
  // Pernas
  "Barbell_Full_Squat",
  "Leg_Press",
  "Leg_Extensions",
  "Lying_Leg_Curls",
  "Seated_Leg_Curl",
  "Hack_Squat",
  "Romanian_Deadlift",
  "Dumbbell_Lunges",
  "Smith_Single-Leg_Split_Squat",
  "Thigh_Abductor",
  "Thigh_Adductor",
  "Standing_Calf_Raises",
  "Seated_Calf_Raise",
  // Glúteos
  "Barbell_Hip_Thrust",
  "Glute_Kickback",
  // Abdômen
  "Plank",
  "Crunches",
  "Cable_Crunch",
  "Hanging_Leg_Raise",
  "Ab_Crunch_Machine",
  "Reverse_Crunch",
  // Cardio
  "Running_Treadmill",
  "Walking_Treadmill",
  "Bicycling_Stationary",
  "Elliptical_Trainer",
  "Rope_Jumping",
  "burpee",
];

/** Traduções erradas e nomes repetidos. Nunca reaproveitar um nome antigo em outro exercício. */
const NOMES_CORRIGIDOS: Record<string, string> = {
  Lying_Leg_Curls: "Mesa Flexora",
  Leg_Extensions: "Cadeira Extensora",
  "Single-Leg_Leg_Extension": "Cadeira Extensora Unilateral",
  Thigh_Abductor: "Cadeira Abdutora",
  Thigh_Adductor: "Cadeira Adutora",
  Butterfly: "Voador (Peck Deck)",
  Reverse_Machine_Flyes: "Voador Invertido",
  "Wide-Grip_Lat_Pulldown": "Puxada Frontal com Pegada Larga",
  Cable_Incline_Pushdown: "Pulldown Inclinado na Polia",
  // Eram duplicados: dois exercícios diferentes com o mesmo nome misturavam o histórico.
  Jogging_Treadmill: "Trote na Esteira",
  Split_Squat_with_Dumbbells: "Afundo Estático com Halteres",
  Chain_Press: "Supino com Correntes Suspensas",
  Snatch_from_Blocks: "Snatch a Partir de Blocos",
  Power_Clean_from_Blocks: "Power Clean a Partir de Blocos",
};

/** Como o exercício é chamado na academia, quando o nome do catálogo é outro. */
const SINONIMOS: Record<string, string> = {
  Lying_Leg_Curls: "cadeira flexora deitada flexao de joelhos posterior de coxa",
  Seated_Leg_Curl: "mesa flexora sentada flexao de joelhos posterior de coxa",
  Leg_Extensions: "extensao de pernas extensora quadriceps",
  "Single-Leg_Leg_Extension": "extensao de pernas extensora",
  Thigh_Abductor: "abdutora abducao de quadril",
  Thigh_Adductor: "adutora aducao de quadril",
  Butterfly: "peck deck pec deck crucifixo maquina fly",
  Reverse_Machine_Flyes: "peck deck invertido crucifixo inverso maquina",
  "Wide-Grip_Lat_Pulldown": "puxada alta pulley frente pulldown puxador",
  "Close-Grip_Front_Lat_Pulldown": "puxada frontal fechada pulley frente puxador",
  "V-Bar_Pulldown": "puxada triangulo puxada frontal puxador pulldown",
  Underhand_Cable_Pulldowns: "puxada supinada puxador",
  "Straight-Arm_Pulldown": "pullover na polia pulldown braco reto",
  Seated_Cable_Rows: "remada baixa remada triangulo",
  Bent_Over_Barbell_Row: "remada curvada pendlay",
  "One-Arm_Dumbbell_Row": "serrote remada unilateral",
  "T-Bar_Row_with_Handle": "remada cavalinho",
  Pullups: "pull up graviton",
  "Chin-Up": "barra supinada graviton",
  Barbell_Deadlift: "terra deadlift",
  Romanian_Deadlift: "stiff rdl terra romeno",
  "Stiff-Legged_Barbell_Deadlift": "stiff terra pernas estendidas",
  "Stiff-Legged_Dumbbell_Deadlift": "stiff com halteres",
  Barbell_Full_Squat: "agachamento livre squat",
  Hack_Squat: "hack machine",
  Barbell_Hip_Thrust: "elevacao pelvica hip thrust gluteo",
  Barbell_Glute_Bridge: "elevacao pelvica ponte gluteo",
  Glute_Kickback: "coice gluteo quatro apoios",
  "Smith_Single-Leg_Split_Squat": "bulgaro afundo",
  Dumbbell_Lunges: "passada avanco",
  Barbell_Walking_Lunge: "passada avanco caminhando",
  "Barbell_Bench_Press_-_Medium_Grip": "supino reto barra bench press",
  Dumbbell_Bench_Press: "supino reto halter",
  Incline_Dumbbell_Press: "supino inclinado halter",
  Machine_Bench_Press: "supino maquina supino articulado chest press",
  Leverage_Chest_Press: "supino articulado chest press",
  Dumbbell_Flyes: "crucifixo reto fly",
  Incline_Dumbbell_Flyes: "crucifixo inclinado fly",
  Cable_Crossover: "cross over polia alta voador na polia",
  Dumbbell_Shoulder_Press: "desenvolvimento halter ombro",
  Barbell_Shoulder_Press: "desenvolvimento barra militar",
  Side_Lateral_Raise: "elevacao lateral ombro",
  Front_Dumbbell_Raise: "elevacao frontal ombro",
  Upright_Barbell_Row: "remada alta",
  Face_Pull: "puxada para o rosto",
  Barbell_Shrug: "encolhimento trapezio",
  Dumbbell_Shrug: "encolhimento trapezio halter",
  Barbell_Curl: "rosca direta barra reta",
  "EZ-Bar_Curl": "rosca direta barra w",
  Dumbbell_Alternate_Bicep_Curl: "rosca alternada",
  Hammer_Curls: "rosca martelo",
  Preacher_Curl: "rosca scott banco scott",
  Concentration_Curls: "rosca concentrada",
  Triceps_Pushdown: "triceps polia triceps na polia barra reta",
  "Triceps_Pushdown_-_Rope_Attachment": "triceps polia triceps na corda",
  "EZ-Bar_Skullcrusher": "triceps testa skull crusher",
  Lying_Triceps_Press: "triceps testa frances deitado",
  Cable_Rope_Overhead_Triceps_Extension: "triceps frances na polia",
  Seated_Triceps_Press: "triceps frances halter",
  Tricep_Dumbbell_Kickback: "triceps coice kickback",
  Bench_Dips: "mergulho paralelas banco",
  "Dips_-_Triceps_Version": "paralelas mergulho",
  Plank: "isometria abdominal plank",
  Side_Bridge: "prancha lateral isometria",
  Crunches: "abdominal supra crunch",
  Reverse_Crunch: "abdominal infra",
  Hanging_Leg_Raise: "abdominal infra elevacao de pernas",
  Ab_Crunch_Machine: "abdominal maquina",
  Standing_Calf_Raises: "panturrilha em pe gemeos",
  Seated_Calf_Raise: "panturrilha sentado banco solear",
  Running_Treadmill: "corrida esteira correr",
  Walking_Treadmill: "caminhada esteira andar",
  Bicycling_Stationary: "bike bicicleta ergometrica spinning",
  Recumbent_Bike: "bike bicicleta ergometrica",
  Elliptical_Trainer: "eliptico transport",
  Stairmaster: "escada simulador de escada",
  Rowing_Stationary: "remo seco",
  Rope_Jumping: "corda",
};

/**
 * O catálogo traz estes como só de tríceps, e o filtro Peito os escondia.
 * Variações de pegada fechada ficam de fora: nelas, o tríceps é mesmo o principal.
 */
const TAMBEM_PEITO = new Set([
  "Bench_Press_-_Powerlifting",
  "Bench_Press_with_Chains",
  "Board_Press",
  "Reverse_Band_Bench_Press",
  "Floor_Press",
  "Floor_Press_with_Chains",
  "Dumbbell_Floor_Press",
  "One_Arm_Floor_Press",
]);

/** Isometrias contam tempo, não repetições. */
const MEDIDA_POR_TEMPO = new Set(["Plank", "Side_Bridge"]);

/** O que falta no catálogo. Sem foto: nenhuma imagem é reaproveitada de outro movimento. */
const EXERCICIOS_EXTRAS: ExercicioCatalogo[] = [
  {
    id: "burpee",
    name: "Burpee",
    force: null,
    level: "intermediate",
    mechanic: "compound",
    equipment: "body only",
    primaryMuscles: ["quadriceps"],
    secondaryMuscles: ["chest", "shoulders", "abdominals"],
    instructions: [
      "Em pé, agache e apoie as mãos no chão.",
      "Leve os pés para trás até ficar em posição de prancha.",
      "Faça uma flexão, se quiser mais intensidade.",
      "Traga os pés de volta para perto das mãos.",
      "Levante-se com um salto, estendendo os braços acima da cabeça.",
    ],
    category: "plyometrics",
    images: [],
  },
];

const POSICAO_POPULAR = new Map(EXERCICIOS_POPULARES.map((id, i) => [id, i]));

export const posicaoPopular = (id: string): number | undefined => POSICAO_POPULAR.get(id);

/** IDs citados nas listas acima que precisam existir. Conferido por teste. */
export const idsCurados = (): string[] => [
  ...EXERCICIOS_POPULARES,
  ...Object.keys(NOMES_CORRIGIDOS),
  ...Object.keys(SINONIMOS),
  ...TAMBEM_PEITO,
];

export const sinonimosDe = (id: string): string => SINONIMOS[id] ?? "";

export function aplicarCuradoria(catalogo: ExercicioCatalogo[]): ExercicioCatalogo[] {
  return [
    ...catalogo.map((exercicio) => {
      const name = NOMES_CORRIGIDOS[exercicio.id];
      const peito = TAMBEM_PEITO.has(exercicio.id);
      const porTempo = MEDIDA_POR_TEMPO.has(exercicio.id);
      if (!name && !peito && !porTempo) return exercicio;
      return {
        ...exercicio,
        ...(name ? { name } : {}),
        ...(peito ? { primaryMuscles: ["chest", ...exercicio.primaryMuscles] } : {}),
        ...(porTempo ? { medida: "tempo" as const } : {}),
      };
    }),
    ...EXERCICIOS_EXTRAS,
  ];
}
