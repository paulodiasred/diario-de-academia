import type { ExercicioCatalogo } from "@/types/catalogo";
import { normalizarBusca } from "./texto";

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
