import type { TreinoPersonalizado } from "@/types/catalogo";
import { chaveDiaLocal } from "./datas";
import { duracaoDaSessao, maiorPeso, nomeDoDia, type Sessao } from "./sessao";

const DIA_MS = 24 * 60 * 60 * 1000;

/** Soma dias pelo calendário local, para o horário de verão não deslocar a data. */
function somarDias(data: Date, dias: number): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias);
}

/** Segunda-feira da semana, às 00:00 locais. */
export function inicioDaSemana(data: Date): Date {
  const voltar = (data.getDay() + 6) % 7;
  return somarDias(data, -voltar);
}

const dataDa = (sessao: Sessao) => new Date(sessao.iniciadaEm);

function finalizadas(sessoes: Sessao[]): Sessao[] {
  return sessoes.filter((s) => s.finalizadaEm);
}

function entre(sessoes: Sessao[], inicio: Date, fim: Date): Sessao[] {
  return finalizadas(sessoes).filter((s) => {
    const data = dataDa(s);
    return data >= inicio && data < fim;
  });
}

export interface ResumoPeriodo {
  treinos: number;
  diasAtivos: number;
  series: number;
  volumeKg: number;
  /** Séries com carga e sem repetições: registros antigos, fora do volume. */
  seriesSemReps: number;
  tempoSeg: number;
  /** Sessões sem duração conhecida: registros antigos, fora do tempo. */
  sessoesSemTempo: number;
}

export function resumirSessoes(sessoes: Sessao[]): ResumoPeriodo {
  const resumo: ResumoPeriodo = {
    treinos: sessoes.length,
    diasAtivos: new Set(sessoes.map((s) => chaveDiaLocal(dataDa(s)))).size,
    series: 0,
    volumeKg: 0,
    seriesSemReps: 0,
    tempoSeg: 0,
    sessoesSemTempo: 0,
  };
  for (const sessao of sessoes) {
    const duracao = duracaoDaSessao(sessao);
    if (duracao === null) resumo.sessoesSemTempo += 1;
    else resumo.tempoSeg += duracao;

    for (const serie of sessao.exercicios.flatMap((e) => e.series)) {
      if (!serie.concluida) continue;
      resumo.series += 1;
      if ((serie.peso ?? 0) <= 0) continue;
      if (serie.reps === null) resumo.seriesSemReps += 1;
      else resumo.volumeKg += (serie.peso as number) * serie.reps;
    }
  }
  return resumo;
}

export function resumoDoPeriodo(sessoes: Sessao[], inicio: Date, fim: Date): ResumoPeriodo {
  return resumirSessoes(entre(sessoes, inicio, fim));
}

export function treinosDaSemana(sessoes: Sessao[], agora: Date = new Date()): number {
  const inicio = inicioDaSemana(agora);
  return entre(sessoes, inicio, somarDias(inicio, 7)).length;
}

export function resumoDoMes(sessoes: Sessao[], agora: Date = new Date()): ResumoPeriodo {
  return resumoDoPeriodo(
    sessoes,
    new Date(agora.getFullYear(), agora.getMonth(), 1),
    new Date(agora.getFullYear(), agora.getMonth() + 1, 1),
  );
}

export interface ComparacaoPeriodos {
  atual: ResumoPeriodo;
  anterior: ResumoPeriodo;
}

/** Os últimos `dias` contra os `dias` imediatamente anteriores, contando hoje inteiro. */
export function compararPeriodos(
  sessoes: Sessao[],
  dias: number,
  agora: Date = new Date(),
): ComparacaoPeriodos {
  const fim = somarDias(agora, 1);
  const meio = somarDias(fim, -dias);
  const inicio = somarDias(meio, -dias);
  return {
    atual: resumoDoPeriodo(sessoes, meio, fim),
    anterior: resumoDoPeriodo(sessoes, inicio, meio),
  };
}

/** null quando não há base de comparação: dividir por zero não vira "+100%". */
export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 100);
}

export interface Semana {
  inicio: Date;
  rotulo: string;
  treinos: number;
  volumeKg: number;
}

/** As últimas `quantidade` semanas, em ordem cronológica, incluindo semanas sem treino. */
export function semanasRecentes(
  sessoes: Sessao[],
  agora: Date = new Date(),
  quantidade = 8,
): Semana[] {
  const atual = inicioDaSemana(agora);
  return Array.from({ length: quantidade }, (_, i) => {
    const inicio = somarDias(atual, -7 * (quantidade - 1 - i));
    const resumo = resumoDoPeriodo(sessoes, inicio, somarDias(inicio, 7));
    return {
      inicio,
      rotulo: inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      treinos: resumo.treinos,
      volumeKg: resumo.volumeKg,
    };
  });
}

/**
 * Semanas seguidas com pelo menos um treino. A semana atual só soma:
 * ainda não treinar nesta semana não quebra a sequência.
 */
export function sequenciaDeSemanas(sessoes: Sessao[], agora: Date = new Date()): number {
  const comTreino = new Set(
    finalizadas(sessoes).map((s) => chaveDiaLocal(inicioDaSemana(dataDa(s)))),
  );
  let semana = inicioDaSemana(agora);
  if (!comTreino.has(chaveDiaLocal(semana))) semana = somarDias(semana, -7);

  let total = 0;
  while (comTreino.has(chaveDiaLocal(semana))) {
    total += 1;
    semana = somarDias(semana, -7);
  }
  return total;
}

/** A maior sequência de semanas com treino em todo o histórico. */
export function maiorSequenciaDeSemanas(sessoes: Sessao[]): number {
  const semanas = [
    ...new Set(finalizadas(sessoes).map((s) => inicioDaSemana(dataDa(s)).getTime())),
  ].sort((a, b) => a - b);

  let maior = 0;
  let atual = 0;
  let anterior: Date | null = null;
  for (const inicio of semanas) {
    const semana = new Date(inicio);
    const seguida = anterior !== null && chaveDiaLocal(somarDias(anterior, 7)) === chaveDiaLocal(semana);
    atual = seguida ? atual + 1 : 1;
    maior = Math.max(maior, atual);
    anterior = semana;
  }
  return maior;
}

export interface RecordeBatido {
  exercicioId: string;
  nome: string;
  peso: number;
  anterior: number;
  data: string;
}

function emOrdemCronologica(sessoes: Sessao[]): Sessao[] {
  return [...finalizadas(sessoes)].sort((a, b) => dataDa(a).getTime() - dataDa(b).getTime());
}

/** Cada vez que uma carga superou o melhor valor anterior, mais recente primeiro. */
export function recordesBatidos(sessoes: Sessao[]): RecordeBatido[] {
  const melhores = new Map<string, number>();
  const batidos: RecordeBatido[] = [];
  for (const sessao of emOrdemCronologica(sessoes)) {
    for (const exercicio of sessao.exercicios) {
      const peso = maiorPeso(exercicio);
      if (!peso) continue;
      const melhor = melhores.get(exercicio.nome);
      // A primeira vez de um exercício é ponto de partida, não recorde.
      if (melhor !== undefined && peso > melhor) {
        batidos.push({
          exercicioId: exercicio.exercicioId,
          nome: exercicio.nome,
          peso,
          anterior: melhor,
          data: sessao.iniciadaEm,
        });
      }
      if (melhor === undefined || peso > melhor) melhores.set(exercicio.nome, peso);
    }
  }
  return batidos.reverse();
}

export interface ExercicioTreinado {
  exercicioId: string;
  nome: string;
  vezes: number;
  ultimaData: string;
  /** null quando o exercício não usa carga. */
  melhorPeso: number | null;
  melhorPesoData: string | null;
}

/** Exercícios já feitos, do mais recente ao mais antigo. Agrupa pelo nome, como o histórico antigo. */
export function exerciciosTreinados(sessoes: Sessao[]): ExercicioTreinado[] {
  const porNome = new Map<string, ExercicioTreinado>();
  for (const sessao of emOrdemCronologica(sessoes)) {
    for (const exercicio of sessao.exercicios) {
      if (!exercicio.series.some((s) => s.concluida)) continue;
      const atual = porNome.get(exercicio.nome);
      const peso = maiorPeso(exercicio);
      const peso_valido = peso !== null && peso > 0 ? peso : null;
      const bateu = peso_valido !== null && peso_valido > (atual?.melhorPeso ?? 0);
      porNome.set(exercicio.nome, {
        exercicioId: exercicio.exercicioId,
        nome: exercicio.nome,
        vezes: (atual?.vezes ?? 0) + 1,
        ultimaData: sessao.iniciadaEm,
        melhorPeso: bateu ? peso_valido : (atual?.melhorPeso ?? null),
        melhorPesoData: bateu ? sessao.iniciadaEm : (atual?.melhorPesoData ?? null),
      });
    }
  }
  return [...porNome.values()].sort((a, b) => tempoIso(b.ultimaData) - tempoIso(a.ultimaData));
}

const tempoIso = (iso: string) => new Date(iso).getTime();

export interface DiaCalendario {
  data: Date;
  chave: string;
  doMes: boolean;
  sessoes: Sessao[];
}

/** Semanas completas, de segunda a domingo, que cobrem o mês. */
export function calendarioDoMes(sessoes: Sessao[], ano: number, mes: number): DiaCalendario[][] {
  const porDia = new Map<string, Sessao[]>();
  for (const sessao of finalizadas(sessoes)) {
    const chave = chaveDiaLocal(dataDa(sessao));
    porDia.set(chave, [...(porDia.get(chave) ?? []), sessao]);
  }

  const semanas: DiaCalendario[][] = [];
  let dia = inicioDaSemana(new Date(ano, mes, 1));
  const fim = new Date(ano, mes + 1, 1);
  while (dia < fim) {
    const semana: DiaCalendario[] = [];
    for (let i = 0; i < 7; i++) {
      const chave = chaveDiaLocal(dia);
      semana.push({ data: dia, chave, doMes: dia.getMonth() === mes, sessoes: porDia.get(chave) ?? [] });
      dia = somarDias(dia, 1);
    }
    semanas.push(semana);
  }
  return semanas;
}

export interface ProximoTreino {
  treino: TreinoPersonalizado;
  dia: string;
  emDias: number;
}

/** Próximo treino pela agenda. O de hoje que já foi feito não conta. */
export function proximoTreino(
  treinos: TreinoPersonalizado[],
  sessoes: Sessao[],
  agora: Date = new Date(),
): ProximoTreino | null {
  const hoje = chaveDiaLocal(agora);
  const feitosHoje = new Set(
    finalizadas(sessoes)
      .filter((s) => chaveDiaLocal(dataDa(s)) === hoje)
      .map((s) => s.treinoId),
  );

  for (let emDias = 0; emDias <= 7; emDias++) {
    const dia = nomeDoDia(new Date(agora.getTime() + emDias * DIA_MS));
    const treino = treinos.find(
      (t) => t.dias?.includes(dia) && !(emDias === 0 && feitosHoje.has(t.id ?? null)),
    );
    if (treino) return { treino, dia, emDias };
  }
  return null;
}
