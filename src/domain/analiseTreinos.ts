import { z } from "zod";
import {
  compararPeriodos,
  identificarExercicios,
  recordesRecentes,
  rmEstimado,
  seriesPorGrupo,
  sessoesDosUltimosDias,
  variacaoPercentual,
  type ResumoPeriodo,
} from "./estatisticas";
import { COTA_MENSAL_DE_ANALISES } from "./planos";
import type { ExercicioSessao, Sessao } from "./sessao";

export { COTA_MENSAL_DE_ANALISES };

/** Usado pelo app e pela Cloud Function. Quem garante os limites é o servidor. */
export const DIAS_DA_ANALISE = 30;
export const MINIMO_DE_TREINOS = 4;

const MAXIMO_DE_EXERCICIOS = 15;
const MAXIMO_DE_RECORDES = 10;
const MAXIMO_DE_ITENS = 3;
const TAMANHO_DO_NOME = 60;
const TAMANHO_DO_RESUMO = 600;
const TAMANHO_DO_ITEM = 300;

export interface NumerosDoPeriodo {
  treinos: number;
  diasAtivos: number;
  series: number;
  volumeKg: number;
  minutos: number;
}

export interface ExercicioNaAnalise {
  nome: string;
  treinos: number;
  series: number;
  /** Primeiro e último valor do período. null: o exercício não usa essa medida. */
  cargaKg: { inicio: number; fim: number } | null;
  rmEstimadoKg: { inicio: number; fim: number } | null;
  repsSemCarga: { inicio: number; fim: number } | null;
}

/**
 * Tudo o que a IA recebe. Lista fechada: sem nome ou email da conta, sem observações,
 * sem nome do treino e sem datas. Só o nome dos exercícios é texto escrito pela pessoa.
 */
export interface DadosDaAnalise {
  dias: number;
  atual: NumerosDoPeriodo;
  anterior: NumerosDoPeriodo;
  variacaoPercentual: { treinos: number | null; series: number | null; volumeKg: number | null };
  seriesPorGrupo: Array<{ grupo: string; series: number }>;
  exercicios: ExercicioNaAnalise[];
  recordes: Array<{ exercicio: string; valor: string; anterior: string }>;
}

const numeros = (r: ResumoPeriodo): NumerosDoPeriodo => ({
  treinos: r.treinos,
  diasAtivos: r.diasAtivos,
  series: r.series,
  volumeKg: Math.round(r.volumeKg),
  minutos: Math.round(r.tempoSeg / 60),
});

const nomeCurto = (nome: string) => nome.trim().slice(0, TAMANHO_DO_NOME);

export function treinosDoPeriodo(sessoes: Sessao[], agora: Date = new Date()): number {
  return sessoesDosUltimosDias(sessoes, DIAS_DA_ANALISE, agora).length;
}

export function temTreinosSuficientes(sessoes: Sessao[], agora: Date = new Date()): boolean {
  return treinosDoPeriodo(sessoes, agora) >= MINIMO_DE_TREINOS;
}

interface Acumulado {
  nome: string;
  treinos: number;
  series: number;
  cargas: number[];
  rms: number[];
  reps: number[];
}

const inicioEFim = (valores: number[]) =>
  valores.length > 0 ? { inicio: valores[0], fim: valores[valores.length - 1] } : null;

function exerciciosDoPeriodo(todas: Sessao[], doPeriodo: Sessao[]): ExercicioNaAnalise[] {
  const identidade = identificarExercicios(todas);
  const cronologica = [...doPeriodo].sort(
    (a, b) => new Date(a.iniciadaEm).getTime() - new Date(b.iniciadaEm).getTime(),
  );
  const porExercicio = new Map<string, Acumulado>();

  const registrar = (exercicio: ExercicioSessao) => {
    const feitas = exercicio.series.filter((s) => s.concluida);
    if (feitas.length === 0) return;
    const chave = identidade(exercicio);
    const atual = porExercicio.get(chave) ?? { nome: "", treinos: 0, series: 0, cargas: [], rms: [], reps: [] };
    atual.nome = exercicio.nome;
    atual.treinos += 1;
    atual.series += feitas.length;

    const cargas = feitas.map((s) => s.peso ?? 0).filter((p) => p > 0);
    if (cargas.length > 0) atual.cargas.push(Math.max(...cargas));

    const rms = feitas.map((s) => rmEstimado(s.peso, s.reps)).filter((v): v is number => v !== null);
    if (rms.length > 0) atual.rms.push(Math.max(...rms));

    const reps = feitas.filter((s) => (s.peso ?? 0) === 0 && s.reps !== null).map((s) => s.reps as number);
    if (reps.length > 0) atual.reps.push(Math.max(...reps));

    porExercicio.set(chave, atual);
  };
  cronologica.forEach((sessao) => sessao.exercicios.forEach(registrar));

  return [...porExercicio.values()]
    .sort((a, b) => b.series - a.series)
    .slice(0, MAXIMO_DE_EXERCICIOS)
    .map((e) => ({
      nome: nomeCurto(e.nome),
      treinos: e.treinos,
      series: e.series,
      cargaKg: inicioEFim(e.cargas),
      rmEstimadoKg: inicioEFim(e.rms),
      repsSemCarga: inicioEFim(e.reps),
    }));
}

/** Recebe o histórico inteiro: sem ele, qualquer carga do período pareceria um recorde. */
export function montarDadosDaAnalise(sessoes: Sessao[], agora: Date = new Date()): DadosDaAnalise {
  const finalizadas = sessoes.filter((s) => s.finalizadaEm);
  const { atual, anterior } = compararPeriodos(finalizadas, DIAS_DA_ANALISE, agora);
  const doPeriodo = sessoesDosUltimosDias(finalizadas, DIAS_DA_ANALISE, agora);
  const inicioDoPeriodo = Math.min(...doPeriodo.map((s) => new Date(s.iniciadaEm).getTime()));

  return {
    dias: DIAS_DA_ANALISE,
    atual: numeros(atual),
    anterior: numeros(anterior),
    variacaoPercentual: {
      treinos: variacaoPercentual(atual.treinos, anterior.treinos),
      series: variacaoPercentual(atual.series, anterior.series),
      volumeKg: variacaoPercentual(atual.volumeKg, anterior.volumeKg),
    },
    seriesPorGrupo: seriesPorGrupo(finalizadas, DIAS_DA_ANALISE, agora).map((g) => ({
      grupo: g.rotulo,
      series: g.series,
    })),
    exercicios: exerciciosDoPeriodo(finalizadas, doPeriodo),
    recordes: recordesRecentes(finalizadas)
      .filter((r) => new Date(r.data).getTime() >= inicioDoPeriodo)
      .slice(0, MAXIMO_DE_RECORDES)
      .map((r) => ({ exercicio: nomeCurto(r.nome), valor: r.valor, anterior: r.anterior })),
  };
}

/** O formato pedido à IA. Os limites de tamanho são aplicados em `normalizarAnalise`. */
export const respostaDaAnaliseSchema = z.object({
  resumo: z.string(),
  evolucao: z.array(z.string()),
  atencao: z.array(z.string()),
  sugestoes: z.array(z.string()),
});

export type RespostaDaAnalise = z.infer<typeof respostaDaAnaliseSchema>;

const lista = (itens: string[]) =>
  itens
    .map((item) => item.trim().slice(0, TAMANHO_DO_ITEM))
    .filter(Boolean)
    .slice(0, MAXIMO_DE_ITENS);

/** null: a resposta veio sem conteúdo aproveitável. */
export function normalizarAnalise(resposta: RespostaDaAnalise): RespostaDaAnalise | null {
  const resumo = resposta.resumo.trim().slice(0, TAMANHO_DO_RESUMO);
  if (!resumo) return null;
  return {
    resumo,
    evolucao: lista(resposta.evolucao),
    atencao: lista(resposta.atencao),
    sugestoes: lista(resposta.sugestoes),
  };
}

/** "2026-11": a cota recomeça a cada mês. */
export function mesDaCota(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

/** Análises já usadas no mês. Um contador de outro mês já não vale. */
export function analisesUsadas(uso: { mes?: unknown; analises?: unknown } | null, agora: Date = new Date()): number {
  if (!uso || uso.mes !== mesDaCota(agora) || typeof uso.analises !== "number") return 0;
  return uso.analises;
}
