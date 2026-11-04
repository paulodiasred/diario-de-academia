import { z } from "zod";
import type { ExercicioNoTreino } from "@/types/catalogo";

/** Limites espelhados em firestore.rules. Altere os dois juntos. */
const medidaSchema = z.enum(["carga_reps", "peso_corporal", "tempo", "distancia"]);

const numeroOpcional = (maximo: number) => z.number().min(0).max(maximo).optional();

const exercicioNoTreinoSchema = z
  .object({
    exercicioId: z.string().min(1),
    exercicioNome: z.string().min(1),
    primaryMuscles: z.array(z.string()),
    category: z.string(),
    series: z.number().int().min(1).max(100),
    descanso: z.number().min(0).max(3600),
    ordem: z.number().int().min(0),
    images: z.array(z.string()).optional(),
    medida: medidaSchema.optional(),
    repsAlvo: numeroOpcional(1000),
    cargaAlvo: numeroOpcional(2000),
    duracaoAlvoSeg: numeroOpcional(86400),
    distanciaAlvoM: numeroOpcional(1_000_000),
  })
  .passthrough();

export const treinoInputSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  // Descrição vazia é salva como "". O Firestore rejeita `undefined` (bug B1).
  descricao: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((v) => v ?? ""),
  dias: z.array(z.string()).max(7).default([]),
  exercicios: z.array(exercicioNoTreinoSchema).min(1).max(100),
});

export type TreinoInput = Omit<z.input<typeof treinoInputSchema>, "exercicios"> & {
  exercicios: ExercicioNoTreino[];
};

export function normalizarTreino(input: TreinoInput) {
  return treinoInputSchema.parse(input);
}

export const exercicioProprioSchema = z.object({
  name: z.string().trim().min(1, "Dê um nome ao exercício").max(120),
  category: z.string().min(1).max(40),
  equipment: z.string().max(40).nullable(),
  medida: medidaSchema,
  primaryMuscles: z.array(z.string()).min(1, "Escolha o músculo principal").max(5),
  secondaryMuscles: z.array(z.string()).max(10).default([]),
  instructions: z.array(z.string().max(1000)).max(30).default([]),
});

export type ExercicioProprioInput = z.input<typeof exercicioProprioSchema>;

export function normalizarExercicioProprio(input: ExercicioProprioInput) {
  return exercicioProprioSchema.parse(input);
}
