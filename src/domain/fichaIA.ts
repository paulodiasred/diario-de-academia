import { z } from "zod";
import { MUSCULO_LABEL, medidaPadraoDoCatalogo, type ExercicioCatalogo } from "@/types/catalogo";
import { EXERCICIOS_POPULARES } from "./curadoriaCatalogo";
import type { AjustesExercicio } from "./catalogo";
import type { ModeloTreino } from "./modelosTreino";
import { COTA_MENSAL_DE_FICHAS } from "./planos";

export { COTA_MENSAL_DE_FICHAS };

/** Só campos de escolha: nenhum texto livre chega à IA. */
export const preferenciasFichaSchema = z.object({
  objetivo: z.enum(["hipertrofia", "forca", "condicionamento"]),
  dias: z.number().int().min(2).max(6),
  local: z.enum(["academia", "halteres", "casa"]),
  experiencia: z.enum(["iniciante", "intermediario", "avancado"]),
  /** Lesão, dor ou condição de saúde que limite exercícios: nesse caso, a IA não monta a ficha. */
  restricao: z.boolean(),
});

export type PreferenciasFicha = z.infer<typeof preferenciasFichaSchema>;

export const OPCOES_FICHA = {
  objetivo: [
    { valor: "hipertrofia", rotulo: "Ganhar massa" },
    { valor: "forca", rotulo: "Ganhar força" },
    { valor: "condicionamento", rotulo: "Condicionamento" },
  ],
  local: [
    { valor: "academia", rotulo: "Academia completa" },
    { valor: "halteres", rotulo: "Halteres e banco" },
    { valor: "casa", rotulo: "Sem equipamento" },
  ],
  experiencia: [
    { valor: "iniciante", rotulo: "Menos de 6 meses" },
    { valor: "intermediario", rotulo: "De 6 meses a 2 anos" },
    { valor: "avancado", rotulo: "Mais de 2 anos" },
  ],
} as const;

export const AVISO_RESTRICAO =
  "Com lesão, dor ou condição de saúde, a ficha precisa de avaliação individual. Procure um profissional de educação física ou da saúde. Os modelos prontos e a montagem manual continuam disponíveis.";

const EQUIPAMENTOS: Record<PreferenciasFicha["local"], string[] | null> = {
  academia: null,
  halteres: ["dumbbell", "body only"],
  casa: ["body only"],
};

const MINIMO_DE_OPCOES = 35;
// Exercícios medidos por tempo, como a prancha, não cabem em "séries x repetições".
const POR_TEMPO = /prancha|plank|isom[eé]tric|hold|segurar|alongamento|stretch/i;

export interface ExercicioCandidato {
  id: string;
  nome: string;
  musculo: string;
  equipamento: string;
}

function serve(ex: ExercicioCatalogo, permitidos: string[] | null): boolean {
  if (permitidos && !permitidos.includes(ex.equipment ?? "")) return false;
  if (ex.category !== "strength" && ex.category !== "powerlifting") return false;
  if (POR_TEMPO.test(ex.name) || POR_TEMPO.test(ex.id)) return false;
  const medida = medidaPadraoDoCatalogo(ex);
  return medida === "carga_reps" || medida === "peso_corporal";
}

/**
 * As opções que a IA pode escolher: primeiro os populares, que a curadoria conferiu. Se
 * forem poucos para o equipamento, completa com exercícios de força do catálogo, sem os avançados.
 */
export function candidatosDaFicha(catalogo: ExercicioCatalogo[], local: PreferenciasFicha["local"]): ExercicioCandidato[] {
  const permitidos = EQUIPAMENTOS[local];
  const porId = new Map(catalogo.map((e) => [e.id, e]));
  const escolhidos = EXERCICIOS_POPULARES.map((id) => porId.get(id)).filter(
    (e): e is ExercicioCatalogo => !!e && serve(e, permitidos),
  );
  if (escolhidos.length < MINIMO_DE_OPCOES) {
    const ja = new Set(escolhidos.map((e) => e.id));
    for (const e of catalogo) {
      if (escolhidos.length >= MINIMO_DE_OPCOES) break;
      if (!ja.has(e.id) && !e.proprio && e.level !== "expert" && serve(e, permitidos)) escolhidos.push(e);
    }
  }
  return escolhidos.map((e) => ({
    id: e.id,
    nome: e.name,
    musculo: MUSCULO_LABEL[e.primaryMuscles[0]] ?? e.primaryMuscles[0] ?? "",
    equipamento: e.equipment ?? "",
  }));
}

/** O formato pedido à IA. Os limites são conferidos em `validarFicha`. */
export const respostaDaFichaSchema = z.object({
  nome: z.string(),
  resumo: z.string(),
  fichas: z.array(
    z.object({
      nome: z.string(),
      exercicios: z.array(
        z.object({
          id: z.string(),
          series: z.number().int(),
          repeticoes: z.number().int(),
          descansoSeg: z.number().int(),
        }),
      ),
    }),
  ),
});

export type RespostaDaFicha = z.infer<typeof respostaDaFichaSchema>;

const DIAS_DA_SEMANA: Record<number, string[]> = {
  2: ["Segunda", "Quinta"],
  3: ["Segunda", "Quarta", "Sexta"],
  4: ["Segunda", "Terça", "Quinta", "Sexta"],
  5: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"],
  6: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
};

/** As fichas se revezam nos dias: com 2 fichas em 4 dias, fica A, B, A, B. */
export function distribuirDias(dias: number, fichas: number): string[][] {
  const semana = DIAS_DA_SEMANA[dias] ?? [];
  return Array.from({ length: fichas }, (_, i) => semana.filter((_, j) => j % fichas === i));
}

export const MAXIMO_DE_FICHAS = 5;
const EXERCICIOS_POR_FICHA = { minimo: 3, maximo: 10 };
const limitar = (valor: number, minimo: number, maximo: number) => Math.min(maximo, Math.max(minimo, Math.round(valor)));
const texto = (valor: string, tamanho: number) => valor.trim().slice(0, tamanho);

export type ResultadoDaFicha = { modelo: ModeloTreino; problemas: [] } | { modelo: null; problemas: string[] };

/**
 * Confere a resposta antes de ela chegar à pessoa. Problemas de estrutura voltam para a IA
 * corrigir. Números fora da faixa só são ajustados, porque a pessoa revisa tudo antes de salvar.
 */
export function validarFicha(
  resposta: RespostaDaFicha,
  preferencias: PreferenciasFicha,
  candidatos: ExercicioCandidato[],
): ResultadoDaFicha {
  const permitidos = new Set(candidatos.map((c) => c.id));
  const maximoDeFichas = Math.min(preferencias.dias, MAXIMO_DE_FICHAS);
  const problemas: string[] = [];

  if (resposta.fichas.length < 1 || resposta.fichas.length > maximoDeFichas) {
    problemas.push(`Use de 1 a ${maximoDeFichas} fichas. Vieram ${resposta.fichas.length}.`);
  }
  resposta.fichas.forEach((ficha, i) => {
    const ids = ficha.exercicios.map((e) => e.id);
    const desconhecidos = ids.filter((id) => !permitidos.has(id));
    if (desconhecidos.length > 0) problemas.push(`Ficha ${i + 1}: IDs fora da lista: ${desconhecidos.join(", ")}.`);
    if (new Set(ids).size !== ids.length) problemas.push(`Ficha ${i + 1}: exercício repetido.`);
    if (ids.length < EXERCICIOS_POR_FICHA.minimo || ids.length > EXERCICIOS_POR_FICHA.maximo) {
      problemas.push(
        `Ficha ${i + 1}: use de ${EXERCICIOS_POR_FICHA.minimo} a ${EXERCICIOS_POR_FICHA.maximo} exercícios. Vieram ${ids.length}.`,
      );
    }
    if (!ficha.nome.trim()) problemas.push(`Ficha ${i + 1}: falta o nome.`);
  });
  if (problemas.length > 0) return { modelo: null, problemas };

  const dias = distribuirDias(preferencias.dias, resposta.fichas.length);
  return {
    problemas: [],
    modelo: {
      id: "ia",
      nome: texto(resposta.nome, 80) || "Ficha sugerida",
      frequencia: `${preferencias.dias} vezes por semana`,
      descricao: texto(resposta.resumo, 400),
      fichas: resposta.fichas.map((ficha, i) => ({
        nome: texto(ficha.nome, 80),
        dias: dias[i],
        itens: ficha.exercicios.map((e): [string, AjustesExercicio] => [
          e.id,
          {
            series: limitar(e.series, 1, 6),
            repsAlvo: limitar(e.repeticoes, 1, 30),
            descanso: limitar(e.descansoSeg, 30, 300),
          },
        ]),
      })),
    },
  };
}
