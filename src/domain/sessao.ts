import type { ExercicioNoTreino, TipoMedida, TreinoPersonalizado } from "@/types/catalogo";
import { formatarKg, formatarTempo } from "./texto";

export interface SerieSessao {
  peso: number | null;
  reps: number | null;
  duracaoSeg: number | null;
  distanciaM: number | null;
  concluida: boolean;
  concluidaEm: string | null;
  /** O usuário mexeu nesta série: concluir a anterior não sobrescreve os valores dela. */
  editada: boolean;
}

export interface ExercicioSessao {
  exercicioId: string;
  nome: string;
  medida: TipoMedida;
  descanso: number;
  primaryMuscles: string[];
  images?: string[];
  circuito?: string[];
  notas: string;
  series: SerieSessao[];
}

/** Baseado em horário final: sobrevive a aba em segundo plano, navegação e recarga. */
export interface Descanso {
  fimEm: number | null;
  restanteSeg: number;
  duracaoSeg: number;
}

export interface Sessao {
  id: string;
  treinoId: string | null;
  nome: string;
  iniciadaEm: string;
  finalizadaEm: string | null;
  origem: "app" | "legado";
  notas: string;
  exercicios: ExercicioSessao[];
  exercicioAtual: number;
  descanso: Descanso | null;
  atualizadaEm: string;
  legadoIds?: string[];
}

export const LIMITE_PESO = 2000;
export const LIMITE_REPS = 1000;

const mesmoExercicio = (e: ExercicioSessao, id: string, nome: string) =>
  e.exercicioId === id || e.nome === nome;

const tempo = (iso: string) => new Date(iso).getTime();

function sessoesFinalizadasRecentes(sessoes: Sessao[]): Sessao[] {
  return sessoes
    .filter((s) => s.finalizadaEm)
    .sort((a, b) => tempo(b.iniciadaEm) - tempo(a.iniciadaEm));
}

/** Última vez em que o exercício foi feito, com séries concluídas. */
export function ultimaExecucao(
  sessoes: Sessao[],
  exercicioId: string,
  nome: string,
): ExercicioSessao | null {
  for (const sessao of sessoesFinalizadasRecentes(sessoes)) {
    const achado = sessao.exercicios.find(
      (e) => mesmoExercicio(e, exercicioId, nome) && e.series.some((s) => s.concluida),
    );
    if (achado) return achado;
  }
  return null;
}

/**
 * Último valor registrado na mesma posição; depois, o alvo do treino.
 * O que nunca foi informado fica vazio: nenhum valor é inventado.
 */
function serieSugerida(ex: ExercicioNoTreino, anterior: ExercicioSessao | null, indice: number): SerieSessao {
  const feitas = anterior?.series.filter((s) => s.concluida) ?? [];
  const base = feitas[indice] ?? feitas[feitas.length - 1];
  return {
    peso: base?.peso ?? ex.cargaAlvo ?? null,
    reps: base?.reps ?? ex.repsAlvo ?? null,
    duracaoSeg: base?.duracaoSeg ?? ex.duracaoAlvoSeg ?? null,
    distanciaM: base?.distanciaM ?? ex.distanciaAlvoM ?? null,
    concluida: false,
    concluidaEm: null,
    editada: false,
  };
}

export function medidaDoExercicio(ex: Pick<ExercicioNoTreino, "medida" | "category">): TipoMedida {
  return ex.medida ?? (ex.category === "cardio" ? "tempo" : "carga_reps");
}

export function criarSessao(
  id: string,
  treino: Pick<TreinoPersonalizado, "id" | "nome" | "exercicios">,
  anteriores: Sessao[],
  agora: Date = new Date(),
): Sessao {
  const exercicios = [...treino.exercicios]
    .sort((a, b) => a.ordem - b.ordem)
    .map((ex): ExercicioSessao => {
      const anterior = ultimaExecucao(anteriores, ex.exercicioId, ex.exercicioNome);
      return {
        exercicioId: ex.exercicioId,
        nome: ex.exercicioNome,
        medida: medidaDoExercicio(ex),
        descanso: ex.descanso,
        primaryMuscles: ex.primaryMuscles,
        images: ex.images,
        circuito: ex.circuito,
        notas: "",
        series: Array.from({ length: ex.series }, (_, i) => serieSugerida(ex, anterior, i)),
      };
    });

  return {
    id,
    treinoId: treino.id ?? null,
    nome: treino.nome,
    iniciadaEm: agora.toISOString(),
    finalizadaEm: null,
    origem: "app",
    notas: "",
    exercicios,
    exercicioAtual: 0,
    descanso: null,
    atualizadaEm: agora.toISOString(),
  };
}

function alterarExercicio(
  sessao: Sessao,
  indice: number,
  alterar: (e: ExercicioSessao) => ExercicioSessao,
): Sessao {
  return {
    ...sessao,
    exercicios: sessao.exercicios.map((e, i) => (i === indice ? alterar(e) : e)),
  };
}

export type CamposSerie = Partial<Pick<SerieSessao, "peso" | "reps" | "duracaoSeg" | "distanciaM">>;

export function atualizarSerie(
  sessao: Sessao,
  exercicio: number,
  serie: number,
  campos: CamposSerie,
): Sessao {
  return alterarExercicio(sessao, exercicio, (e) => ({
    ...e,
    series: e.series.map((s, i) => (i === serie ? { ...s, ...campos, editada: true } : s)),
  }));
}

export type ErroSerie = "peso" | "reps" | null;

export function validarSerie(serie: SerieSessao, medida: TipoMedida): ErroSerie {
  if (medida === "carga_reps" && (serie.peso === null || serie.peso < 0)) return "peso";
  if (serie.peso !== null && serie.peso > LIMITE_PESO) return "peso";
  if (medida === "carga_reps" || medida === "peso_corporal") {
    if (serie.reps === null || serie.reps <= 0 || serie.reps > LIMITE_REPS) return "reps";
  }
  // Tempo e distância podem ser só "feito": é assim que o cardio já funcionava.
  return null;
}

const pendente = (e: ExercicioSessao) => e.series.some((s) => !s.concluida);

function proximoPendente(sessao: Sessao, aPartirDe: number): number {
  const total = sessao.exercicios.length;
  for (let passo = 1; passo < total; passo++) {
    const i = (aPartirDe + passo) % total;
    if (pendente(sessao.exercicios[i])) return i;
  }
  return aPartirDe;
}

export interface ResultadoSerie {
  sessao: Sessao;
  erro: ErroSerie;
}

/** O toque único: conclui a série (ou desfaz), repassa os valores e inicia o descanso. */
export function alternarSerie(
  sessao: Sessao,
  exercicio: number,
  serie: number,
  agora: Date = new Date(),
): ResultadoSerie {
  const ex = sessao.exercicios[exercicio];
  const alvo = ex?.series[serie];
  if (!ex || !alvo) return { sessao, erro: null };

  if (alvo.concluida) {
    const desfeita = alterarExercicio(sessao, exercicio, (e) => ({
      ...e,
      series: e.series.map((s, i) => (i === serie ? { ...s, concluida: false, concluidaEm: null } : s)),
    }));
    return { sessao: desfeita, erro: null };
  }

  const erro = validarSerie(alvo, ex.medida);
  if (erro) return { sessao, erro };

  const { peso, reps, duracaoSeg, distanciaM } = alvo;
  const comSerie = alterarExercicio(sessao, exercicio, (e) => ({
    ...e,
    series: e.series.map((s, i) => {
      if (i === serie) return { ...s, concluida: true, concluidaEm: agora.toISOString() };
      if (i > serie && !s.concluida && !s.editada) return { ...s, peso, reps, duracaoSeg, distanciaM };
      return s;
    }),
  }));

  const restaAlgo = comSerie.exercicios.some(pendente);
  return {
    sessao: {
      ...comSerie,
      exercicioAtual: pendente(comSerie.exercicios[exercicio])
        ? exercicio
        : proximoPendente(comSerie, exercicio),
      descanso: ex.descanso > 0 && restaAlgo ? iniciarDescanso(ex.descanso, agora) : comSerie.descanso,
    },
    erro: null,
  };
}

export function adicionarSerie(sessao: Sessao, exercicio: number): Sessao {
  return alterarExercicio(sessao, exercicio, (e) => {
    const ultima = e.series[e.series.length - 1];
    return {
      ...e,
      series: [
        ...e.series,
        {
          peso: ultima?.peso ?? null,
          reps: ultima?.reps ?? null,
          duracaoSeg: ultima?.duracaoSeg ?? null,
          distanciaM: ultima?.distanciaM ?? null,
          concluida: false,
          concluidaEm: null,
          editada: false,
        },
      ],
    };
  });
}

export function removerSerie(sessao: Sessao, exercicio: number, serie: number): Sessao {
  return alterarExercicio(sessao, exercicio, (e) =>
    e.series.length <= 1 ? e : { ...e, series: e.series.filter((_, i) => i !== serie) },
  );
}

export function irParaExercicio(sessao: Sessao, indice: number): Sessao {
  if (indice < 0 || indice >= sessao.exercicios.length) return sessao;
  return { ...sessao, exercicioAtual: indice };
}

export function anotarExercicio(sessao: Sessao, exercicio: number, notas: string): Sessao {
  return alterarExercicio(sessao, exercicio, (e) => ({ ...e, notas }));
}

// ---------- Descanso ----------

export function iniciarDescanso(duracaoSeg: number, agora: Date = new Date()): Descanso {
  return { fimEm: agora.getTime() + duracaoSeg * 1000, restanteSeg: duracaoSeg, duracaoSeg };
}

export function segundosRestantes(descanso: Descanso, agoraMs: number = Date.now()): number {
  if (descanso.fimEm === null) return descanso.restanteSeg;
  return Math.max(0, Math.ceil((descanso.fimEm - agoraMs) / 1000));
}

export function pausarDescanso(descanso: Descanso, agoraMs: number = Date.now()): Descanso {
  if (descanso.fimEm === null) return descanso;
  return { ...descanso, fimEm: null, restanteSeg: segundosRestantes(descanso, agoraMs) };
}

export function retomarDescanso(descanso: Descanso, agoraMs: number = Date.now()): Descanso {
  if (descanso.fimEm !== null) return descanso;
  return { ...descanso, fimEm: agoraMs + descanso.restanteSeg * 1000 };
}

/** Controles de -15s e +15s. Retorna null se o tempo acabar. */
export function ajustarDescanso(
  descanso: Descanso,
  deltaSeg: number,
  agoraMs: number = Date.now(),
): Descanso | null {
  const novoRestante = segundosRestantes(descanso, agoraMs) + deltaSeg;
  if (novoRestante <= 0) return null;
  return {
    fimEm: descanso.fimEm === null ? null : agoraMs + novoRestante * 1000,
    restanteSeg: novoRestante,
    duracaoSeg: Math.max(descanso.duracaoSeg, novoRestante),
  };
}

// ---------- Finalização e resumo ----------

export function temSerieConcluida(sessao: Sessao): boolean {
  return sessao.exercicios.some((e) => e.series.some((s) => s.concluida));
}

export function contarSeriesPendentes(sessao: Sessao): number {
  return sessao.exercicios.reduce((t, e) => t + e.series.filter((s) => !s.concluida).length, 0);
}

/** O histórico guarda só o que foi feito. */
export function finalizarSessao(sessao: Sessao, agora: Date = new Date()): Sessao {
  return {
    ...sessao,
    finalizadaEm: agora.toISOString(),
    atualizadaEm: agora.toISOString(),
    descanso: null,
    exercicioAtual: 0,
    exercicios: sessao.exercicios
      .map((e) => ({ ...e, series: e.series.filter((s) => s.concluida) }))
      .filter((e) => e.series.length > 0),
  };
}

// ---------- Correção de treino já finalizado ----------

/** A série sai do histórico. O exercício que fica sem séries sai junto. */
export function removerSerieDoHistorico(sessao: Sessao, exercicio: number, serie: number): Sessao {
  return {
    ...sessao,
    exercicios: sessao.exercicios
      .map((e, i) => (i === exercicio ? { ...e, series: e.series.filter((_, j) => j !== serie) } : e))
      .filter((e) => e.series.length > 0),
  };
}

export interface ErroCorrecao {
  exercicio: number;
  serie: number;
  erro: Exclude<ErroSerie, null>;
}

/**
 * A primeira série inválida. Registros antigos nunca tiveram repetições:
 * eles continuam podendo ficar sem, para corrigir só a carga.
 */
export function validarCorrecao(sessao: Sessao): ErroCorrecao | null {
  for (const [exercicio, e] of sessao.exercicios.entries()) {
    for (const [serie, s] of e.series.entries()) {
      const erro = validarSerie(s, e.medida);
      if (!erro) continue;
      if (erro === "reps" && s.reps === null && sessao.origem === "legado") continue;
      return { exercicio, serie, erro };
    }
  }
  return null;
}

export function duracaoDaSessao(sessao: Sessao): number | null {
  // Registros antigos não têm início e fim reais: a duração não é estimada.
  if (sessao.origem === "legado" || !sessao.finalizadaEm) return null;
  return Math.round((tempo(sessao.finalizadaEm) - tempo(sessao.iniciadaEm)) / 1000);
}

export interface RecordeCarga {
  nome: string;
  peso: number;
  anterior: number;
}

export interface ResumoSessao {
  duracaoSeg: number | null;
  exercicios: number;
  series: number;
  volumeKg: number;
  /** Séries com carga mas sem repetições: ficam fora do volume. */
  seriesSemReps: number;
  recordes: RecordeCarga[];
}

export function maiorPeso(e: ExercicioSessao): number | null {
  const pesos = e.series
    .filter((s) => s.concluida && s.peso !== null)
    .map((s) => s.peso as number);
  return pesos.length > 0 ? Math.max(...pesos) : null;
}

export function resumirSessao(sessao: Sessao, anteriores: Sessao[]): ResumoSessao {
  const series = sessao.exercicios.flatMap((e) => e.series).filter((s) => s.concluida);
  const comCarga = series.filter((s) => (s.peso ?? 0) > 0);
  const passadas = anteriores.filter((s) => s.id !== sessao.id && s.finalizadaEm);

  const recordes: RecordeCarga[] = [];
  for (const e of sessao.exercicios) {
    const atual = maiorPeso(e);
    if (!atual) continue;
    const historico = passadas
      .flatMap((s) => s.exercicios)
      .filter((x) => mesmoExercicio(x, e.exercicioId, e.nome))
      .map(maiorPeso)
      .filter((p): p is number => p !== null);
    // Sem histórico não há o que superar: a primeira vez não conta como recorde.
    if (historico.length > 0 && atual > Math.max(...historico)) {
      recordes.push({ nome: e.nome, peso: atual, anterior: Math.max(...historico) });
    }
  }

  return {
    duracaoSeg: duracaoDaSessao(sessao),
    exercicios: sessao.exercicios.length,
    series: series.length,
    volumeKg: comCarga.reduce((t, s) => t + (s.peso as number) * (s.reps ?? 0), 0),
    seriesSemReps: comCarga.filter((s) => s.reps === null).length,
    recordes,
  };
}

// ---------- Evolução por exercício ----------

export interface PontoEvolucao {
  data: string;
  peso: number;
}

/** Maior carga das sessões MAIS RECENTES, em ordem cronológica (regressão B2). */
export function pontosEvolucao(
  sessoes: Sessao[],
  exercicioId: string,
  nome: string,
  limite = 10,
): PontoEvolucao[] {
  const pontos: PontoEvolucao[] = [];
  for (const sessao of sessoesFinalizadasRecentes(sessoes)) {
    if (pontos.length === limite) break;
    const pesos = sessao.exercicios
      .filter((e) => mesmoExercicio(e, exercicioId, nome))
      .map(maiorPeso)
      .filter((p): p is number => p !== null && p > 0);
    if (pesos.length === 0) continue;
    pontos.push({
      data: new Date(sessao.iniciadaEm).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      peso: Math.max(...pesos),
    });
  }
  return pontos.reverse();
}

export interface ItemHistoricoExercicio {
  sessaoId: string;
  data: string;
  series: SerieSessao[];
}

export function historicoDoExercicio(
  sessoes: Sessao[],
  exercicioId: string,
  nome: string,
  limite = 5,
): ItemHistoricoExercicio[] {
  const itens: ItemHistoricoExercicio[] = [];
  for (const sessao of sessoesFinalizadasRecentes(sessoes)) {
    if (itens.length === limite) break;
    const series = sessao.exercicios
      .filter((e) => mesmoExercicio(e, exercicioId, nome))
      .flatMap((e) => e.series)
      .filter((s) => s.concluida);
    if (series.length > 0) {
      itens.push({ sessaoId: sessao.id, data: sessao.iniciadaEm, series });
    }
  }
  return itens;
}

export function descreverSerie(serie: SerieSessao, medida: TipoMedida): string {
  const partes: string[] = [];
  if (serie.duracaoSeg !== null) partes.push(formatarTempo(serie.duracaoSeg));
  if (serie.distanciaM !== null) partes.push(`${serie.distanciaM} m`);
  if (medida === "carga_reps" || serie.peso !== null) {
    if (serie.peso !== null && serie.peso > 0) partes.push(formatarKg(serie.peso));
  }
  if (serie.reps !== null) partes.push(`${serie.reps} reps`);
  return partes.length > 0 ? partes.join(" × ") : "Feito";
}

/** Dia da semana no formato de `DIAS_SEMANA`. */
export function nomeDoDia(data: Date = new Date()): string {
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][data.getDay()];
}
