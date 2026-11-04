import { exerciciosTreinados, resumoDoMes } from "./estatisticas";
import type { Sessao } from "./sessao";

export type TipoMeta = "carga" | "treinos_mes" | "volume_mes";

export const TIPO_META_LABEL: Record<TipoMeta, string> = {
  carga: "Carga em um exercício",
  treinos_mes: "Treinos no mês",
  volume_mes: "Volume no mês",
};

export interface Meta {
  id: string;
  tipo: TipoMeta;
  alvo: number;
  /** Só na meta de carga. */
  exercicioNome: string | null;
}

export interface ProgressoMeta {
  atual: number;
  alvo: number;
  percentual: number;
  concluida: boolean;
  descricao: string;
}

export function progressoDaMeta(
  meta: Meta,
  sessoes: Sessao[],
  agora: Date = new Date(),
): ProgressoMeta {
  let atual = 0;
  let descricao = "";

  if (meta.tipo === "carga") {
    const nome = meta.exercicioNome ?? "";
    atual = exerciciosTreinados(sessoes).find((e) => e.nome === nome)?.melhorPeso ?? 0;
    descricao = `${nome}: ${meta.alvo.toLocaleString("pt-BR")} kg`;
  } else if (meta.tipo === "treinos_mes") {
    atual = resumoDoMes(sessoes, agora).treinos;
    descricao = `${meta.alvo.toLocaleString("pt-BR")} treinos neste mês`;
  } else {
    atual = resumoDoMes(sessoes, agora).volumeKg;
    descricao = `${meta.alvo.toLocaleString("pt-BR")} kg de volume neste mês`;
  }

  return {
    atual,
    alvo: meta.alvo,
    percentual: meta.alvo > 0 ? Math.min(100, Math.round((atual / meta.alvo) * 100)) : 0,
    concluida: atual >= meta.alvo,
    descricao,
  };
}
