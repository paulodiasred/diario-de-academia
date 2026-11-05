import {
  EQUIPAMENTO_LABEL,
  medidaPadraoDoCatalogo,
  MUSCULO_LABEL,
  type ExercicioCatalogo,
  type ExercicioNoTreino,
} from "@/types/catalogo";
import { posicaoPopular, sinonimosDe } from "./curadoriaCatalogo";
import { medidaDoExercicio } from "./sessao";
import { formatarKg, formatarTempo, normalizarBusca } from "./texto";

/** Pelo ID ou, para exercícios antigos sem ligação, pelo nome idêntico. */
export function encontrarExercicio(
  todos: ExercicioCatalogo[],
  exercicioId: string,
  nome: string,
): ExercicioCatalogo | null {
  const alvo = normalizarBusca(nome);
  return (
    todos.find((e) => e.id === exercicioId) ??
    todos.find((e) => normalizarBusca(e.name) === alvo) ??
    null
  );
}

const palavras = (texto: string) =>
  normalizarBusca(texto)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length > 2);

/** Mais palavras em comum primeiro. Sugestão para a pessoa conferir, nunca uma ligação automática. */
export function sugerirExercicios(
  todos: ExercicioCatalogo[],
  busca: string,
  limite = 8,
): ExercicioCatalogo[] {
  const procuradas = palavras(busca);
  if (procuradas.length === 0) return [];
  return todos
    .map((exercicio) => {
      const nome = normalizarBusca(exercicio.name);
      return { exercicio, acertos: procuradas.filter((p) => nome.includes(p)).length };
    })
    .filter((item) => item.acertos > 0)
    .sort((a, b) => b.acertos - a.acertos || a.exercicio.name.length - b.exercicio.name.length)
    .slice(0, limite)
    .map((item) => item.exercicio);
}

// ---------- Grupos musculares ----------

export interface GrupoMuscular {
  id: string;
  rotulo: string;
  musculos: string[];
}

export const GRUPOS_MUSCULARES: GrupoMuscular[] = [
  { id: "peito", rotulo: "Peito", musculos: ["chest"] },
  { id: "costas", rotulo: "Costas", musculos: ["lats", "middle back", "lower back", "traps"] },
  { id: "ombros", rotulo: "Ombros", musculos: ["shoulders"] },
  { id: "biceps", rotulo: "Bíceps", musculos: ["biceps"] },
  { id: "triceps", rotulo: "Tríceps", musculos: ["triceps"] },
  { id: "pernas", rotulo: "Pernas", musculos: ["quadriceps", "hamstrings", "adductors", "abductors", "calves"] },
  { id: "gluteos", rotulo: "Glúteos", musculos: ["glutes"] },
  { id: "abdomen", rotulo: "Abdômen", musculos: ["abdominals"] },
  { id: "cardio", rotulo: "Cardio", musculos: [] },
];

export function pertenceAoGrupo(exercicio: ExercicioCatalogo, grupoId: string): boolean {
  if (grupoId === "cardio") return exercicio.category === "cardio";
  // Corrida na esteira trabalha pernas, mas ninguém a procura em Pernas.
  if (exercicio.category === "cardio") return false;
  const grupo = GRUPOS_MUSCULARES.find((g) => g.id === grupoId);
  return !!grupo && exercicio.primaryMuscles.some((m) => grupo.musculos.includes(m));
}

// ---------- Busca e ordem ----------

/** Fora do treino comum: continuam disponíveis, mas depois dos exercícios de musculação. */
const CATEGORIAS_ESPECIALIZADAS = new Set([
  "stretching",
  "strongman",
  "plyometrics",
  "olympic weightlifting",
]);

const ehEspecializado = (e: ExercicioCatalogo) =>
  CATEGORIAS_ESPECIALIZADAS.has(e.category) && posicaoPopular(e.id) === undefined;

interface IndiceBusca {
  nome: string;
  termos: string;
}

const indices = new WeakMap<ExercicioCatalogo, IndiceBusca>();

function indiceDe(exercicio: ExercicioCatalogo): IndiceBusca {
  const salvo = indices.get(exercicio);
  if (salvo) return salvo;
  const grupos = GRUPOS_MUSCULARES.filter((g) => pertenceAoGrupo(exercicio, g.id)).map((g) => g.rotulo);
  const musculos = exercicio.primaryMuscles.map((m) => MUSCULO_LABEL[m] ?? m);
  const equipamento = exercicio.equipment ? (EQUIPAMENTO_LABEL[exercicio.equipment] ?? exercicio.equipment) : "";
  const indice = {
    nome: normalizarBusca(exercicio.name),
    termos: normalizarBusca(
      [sinonimosDe(exercicio.id), ...grupos, ...musculos, equipamento].join(" "),
    ),
  };
  indices.set(exercicio, indice);
  return indice;
}

/** Menor é melhor. null: não atende à busca. */
function relevancia(exercicio: ExercicioCatalogo, busca: string, tokens: string[]): number | null {
  const { nome, termos } = indiceDe(exercicio);
  const texto = `${nome} ${termos}`;
  if (!tokens.every((t) => texto.includes(t))) return null;

  if (nome === busca) return 0;
  // Exercício próprio é o que a pessoa mais espera encontrar pelo nome.
  if (exercicio.proprio) return 1;
  if (posicaoPopular(exercicio.id) !== undefined) return 2;
  if (ehEspecializado(exercicio)) return 5;
  if (tokens.every((t) => nome.includes(t))) return 3;
  return 4;
}

function compararDentroDoNivel(a: ExercicioCatalogo, b: ExercicioCatalogo): number {
  const pa = posicaoPopular(a.id) ?? Number.MAX_SAFE_INTEGER;
  const pb = posicaoPopular(b.id) ?? Number.MAX_SAFE_INTEGER;
  return pa - pb || a.name.localeCompare(b.name, "pt-BR");
}

/**
 * Sem busca: próprios, populares, demais em ordem alfabética, especializados por último.
 * Com busca: procura também em sinônimos, músculo e equipamento.
 */
export function buscarExercicios(lista: ExercicioCatalogo[], busca: string): ExercicioCatalogo[] {
  const normalizada = normalizarBusca(busca).trim();
  const tokens = normalizada.split(/\s+/).filter(Boolean);

  const comNivel = lista.flatMap((exercicio) => {
    const nivel =
      tokens.length === 0
        ? exercicio.proprio
          ? 1
          : posicaoPopular(exercicio.id) !== undefined
            ? 2
            : ehEspecializado(exercicio)
              ? 5
              : 3
        : relevancia(exercicio, normalizada, tokens);
    return nivel === null ? [] : [{ exercicio, nivel }];
  });

  return comNivel
    .sort((a, b) => a.nivel - b.nivel || compararDentroDoNivel(a.exercicio, b.exercicio))
    .map((item) => item.exercicio);
}

// ---------- Do catálogo para o treino ----------

/** A configuração em uma linha: é o que permite ler a ficha sem abrir cada exercício. */
export function resumirConfiguracao(ex: ExercicioNoTreino): string {
  const medida = medidaDoExercicio(ex);
  const partes: string[] = [];
  if (medida === "carga_reps" || medida === "peso_corporal") {
    partes.push(ex.repsAlvo ? `${ex.series} × ${ex.repsAlvo}` : `${ex.series} séries`);
    if (ex.cargaAlvo) partes.push(formatarKg(ex.cargaAlvo));
  } else {
    partes.push(`${ex.series} ${ex.series === 1 ? "série" : "séries"}`);
    if (ex.duracaoAlvoSeg !== undefined) partes.push(formatarTempo(ex.duracaoAlvoSeg));
    if (ex.distanciaAlvoM !== undefined) partes.push(`${ex.distanciaAlvoM} m`);
  }
  partes.push(`${ex.descanso}s de descanso`);
  return partes.join(" · ");
}

export type AjustesExercicio = Partial<
  Pick<ExercicioNoTreino, "series" | "descanso" | "medida" | "repsAlvo" | "cargaAlvo" | "duracaoAlvoSeg" | "distanciaAlvoM">
>;

export function exercicioParaTreino(
  ex: ExercicioCatalogo,
  ordem: number,
  ajustes: AjustesExercicio = {},
): ExercicioNoTreino {
  const medida = ajustes.medida ?? medidaPadraoDoCatalogo(ex);
  return {
    exercicioId: ex.id,
    exercicioNome: ex.name,
    primaryMuscles: ex.primaryMuscles,
    category: ex.category,
    series: 3,
    descanso: 60,
    ordem,
    images: ex.images,
    ...(medida === "carga_reps" || medida === "peso_corporal" ? { repsAlvo: 10 } : {}),
    ...ajustes,
    medida,
  };
}
