import { z } from "zod";
import type { ExercicioNoTreino } from "@/types/catalogo";

/** Limites espelhados em firestore.rules. Altere os dois juntos. */
export const registroInputSchema = z.object({
  exercicio: z.string().min(1).max(200),
  peso: z.number().min(0).max(2000),
  serie: z.number().int().min(0).max(100),
  dia: z.string().min(1).max(200),
  concluida: z.boolean().default(true),
});

export type RegistroInput = z.input<typeof registroInputSchema>;

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

export function normalizarRegistro(input: RegistroInput) {
  return registroInputSchema.parse(input);
}

export function normalizarTreino(input: TreinoInput) {
  return treinoInputSchema.parse(input);
}
