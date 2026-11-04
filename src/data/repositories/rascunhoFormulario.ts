import type { ExercicioNoTreino } from "@/types/catalogo";

const PREFIXO = "diario:treino-em-edicao:";

export interface ValoresFormularioTreino {
  nome: string;
  descricao: string;
  dias: string[];
  exercicios: ExercicioNoTreino[];
}

export interface RascunhoFormulario {
  valores: ValoresFormularioTreino;
  /** `atualizadoEm` do treino editado: se ele mudou depois, o rascunho ficou velho. */
  versao: string | null;
}

const chave = (uid: string, treinoId?: string) => `${PREFIXO}${uid}:${treinoId ?? "novo"}`;

/**
 * Guardado no aparelho a cada alteração. É o que protege quem usa o voltar do celular,
 * fecha a aba ou fica sem bateria, casos em que não dá para pedir confirmação.
 */
export function lerRascunhoFormulario(uid: string, treinoId?: string): RascunhoFormulario | null {
  try {
    const salvo = localStorage.getItem(chave(uid, treinoId));
    return salvo ? (JSON.parse(salvo) as RascunhoFormulario) : null;
  } catch {
    return null;
  }
}

export function guardarRascunhoFormulario(uid: string, treinoId: string | undefined, rascunho: RascunhoFormulario): void {
  try {
    localStorage.setItem(chave(uid, treinoId), JSON.stringify(rascunho));
  } catch (erro) {
    console.warn("Não foi possível guardar o rascunho do treino:", erro);
  }
}

export function esquecerRascunhoFormulario(uid: string, treinoId?: string): void {
  try {
    localStorage.removeItem(chave(uid, treinoId));
  } catch {
    // Sem localStorage não há o que limpar.
  }
}

/** No logout: nada de nenhuma conta fica neste aparelho. */
export function limparRascunhosFormulario(): void {
  try {
    Object.keys(localStorage)
      .filter((c) => c.startsWith(PREFIXO))
      .forEach((c) => localStorage.removeItem(c));
  } catch {
    // Sem localStorage não há o que limpar.
  }
}
