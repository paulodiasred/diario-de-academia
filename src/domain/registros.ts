import type { TreinoRegistro } from "@/data/treino";
import { mesmoDiaLocal } from "./datas";

const tempo = (r: TreinoRegistro) => new Date(r.data).getTime();

/** Mais recente primeiro. Não altera a lista recebida. */
export function ordenarMaisRecentes(registros: TreinoRegistro[]): TreinoRegistro[] {
  return [...registros].sort((a, b) => tempo(b) - tempo(a));
}

export interface AlvoExercicio {
  exercicio: string;
  /** Dia do treino fixo ("Segunda") ou treino personalizado ("treino-<id>"). */
  dia: string;
}

function registrosDeHoje(registros: TreinoRegistro[], alvo: AlvoExercicio, agora: Date) {
  return registros.filter(
    (r) =>
      r.exercicio === alvo.exercicio &&
      r.dia === alvo.dia &&
      r.concluida !== false &&
      mesmoDiaLocal(new Date(r.data), agora),
  );
}

/** Números das séries já feitas hoje neste exercício, neste treino. Cardio usa a série 0. */
export function seriesFeitasHoje(
  registros: TreinoRegistro[],
  alvo: AlvoExercicio,
  agora: Date = new Date(),
): Set<number> {
  return new Set(registrosDeHoje(registros, alvo, agora).map((r) => r.serie));
}

export function exercicioConcluidoHoje(
  registros: TreinoRegistro[],
  alvo: AlvoExercicio,
  totalSeries: number,
  agora: Date = new Date(),
): boolean {
  return seriesFeitasHoje(registros, alvo, agora).size >= totalSeries;
}

/**
 * Registro a apagar ao desmarcar uma série. Só considera o treino e o dia atuais,
 * para nunca apagar a mesma série de outro treino ou de um dia anterior.
 */
export function localizarRegistroParaDesmarcar(
  registros: TreinoRegistro[],
  alvo: AlvoExercicio,
  serie: number,
  agora: Date = new Date(),
): TreinoRegistro | null {
  const candidatos = registrosDeHoje(registros, alvo, agora).filter((r) => r.serie === serie);
  return ordenarMaisRecentes(candidatos)[0] ?? null;
}

export function ultimoPeso(registros: TreinoRegistro[], exercicio: string): number | null {
  const doExercicio = registros.filter((r) => r.exercicio === exercicio);
  return ordenarMaisRecentes(doExercicio)[0]?.peso ?? null;
}

export interface PontoGrafico {
  data: string;
  peso: number;
}

/** Os registros MAIS RECENTES, em ordem cronológica (antigo → novo), qualquer que seja a ordem recebida. */
export function pontosDoGrafico(registros: TreinoRegistro[], limite = 10): PontoGrafico[] {
  return ordenarMaisRecentes(registros)
    .slice(0, limite)
    .reverse()
    .map((r) => ({
      data: new Date(r.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      peso: r.peso,
    }));
}

export interface ItemHistorico {
  data: string;
  dataStr: string;
  media: number;
  series: number;
}

/** Média de carga por dia, nos últimos `janelaDias`, mais recente primeiro. */
export function historicoPorDia(
  registros: TreinoRegistro[],
  agora: Date = new Date(),
  janelaDias = 7,
  limite = 5,
): ItemHistorico[] {
  const inicio = agora.getTime() - janelaDias * 24 * 60 * 60 * 1000;
  const porDia = new Map<string, { pesos: number[]; data: string }>();

  for (const r of registros) {
    if (r.concluida === false || tempo(r) < inicio) continue;
    const dataStr = new Date(r.data).toLocaleDateString("pt-BR");
    const grupo = porDia.get(dataStr) ?? { pesos: [], data: r.data };
    grupo.pesos.push(r.peso);
    porDia.set(dataStr, grupo);
  }

  return [...porDia.entries()]
    .map(([dataStr, { pesos, data }]) => ({
      data,
      dataStr,
      media: pesos.reduce((soma, p) => soma + p, 0) / pesos.length,
      series: pesos.length,
    }))
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, limite);
}
