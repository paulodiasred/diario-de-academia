import type { TreinoPersonalizado } from "@/types/catalogo";
import { GRUPOS_MUSCULARES } from "./catalogo";
import { chaveDiaLocal } from "./datas";
import { duracaoDaSessao, maiorPeso, nomeDoDia, type ExercicioSessao, type Sessao } from "./sessao";
import { formatarKg } from "./texto";

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

/**
 * A identidade de um exercício ao longo do histórico: mesmo ID ou mesmo nome é o mesmo exercício,
 * inclusive em cadeia. Renomear não divide a evolução, e registros antigos, que só têm o nome,
 * continuam ligados aos novos.
 */
function identificarExercicios(sessoes: Sessao[]): (e: ExercicioSessao) => string {
  const pai = new Map<string, string>();
  const raiz = (chave: string): string => {
    let atual = chave;
    while (pai.has(atual) && pai.get(atual) !== atual) atual = pai.get(atual) as string;
    return atual;
  };
  for (const sessao of sessoes) {
    for (const e of sessao.exercicios) {
      if (!pai.has(`nome:${e.nome}`)) pai.set(`nome:${e.nome}`, `nome:${e.nome}`);
      if (!e.exercicioId) continue;
      if (!pai.has(`id:${e.exercicioId}`)) pai.set(`id:${e.exercicioId}`, `id:${e.exercicioId}`);
      pai.set(raiz(`id:${e.exercicioId}`), raiz(`nome:${e.nome}`));
    }
  }
  return (e) => raiz(`nome:${e.nome}`);
}

/** Cada vez que uma carga superou o melhor valor anterior, mais recente primeiro. */
export function recordesBatidos(sessoes: Sessao[]): RecordeBatido[] {
  const identidade = identificarExercicios(sessoes);
  const melhores = new Map<string, number>();
  const batidos: RecordeBatido[] = [];
  for (const sessao of emOrdemCronologica(sessoes)) {
    for (const exercicio of sessao.exercicios) {
      const peso = maiorPeso(exercicio);
      if (!peso) continue;
      const chave = identidade(exercicio);
      const melhor = melhores.get(chave);
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
      if (melhor === undefined || peso > melhor) melhores.set(chave, peso);
    }
  }
  return batidos.reverse();
}

export interface ExercicioTreinado {
  exercicioId: string;
  /** O nome usado mais recentemente. */
  nome: string;
  /** Todos os nomes que este exercício já teve no histórico. */
  nomes: string[];
  vezes: number;
  ultimaData: string;
  /** null quando o exercício não usa carga. */
  melhorPeso: number | null;
  melhorPesoData: string | null;
}

/** Exercícios já feitos, do mais recente ao mais antigo. */
export function exerciciosTreinados(sessoes: Sessao[]): ExercicioTreinado[] {
  const identidade = identificarExercicios(sessoes);
  const porExercicio = new Map<string, ExercicioTreinado>();
  for (const sessao of emOrdemCronologica(sessoes)) {
    for (const exercicio of sessao.exercicios) {
      if (!exercicio.series.some((s) => s.concluida)) continue;
      const chave = identidade(exercicio);
      const atual = porExercicio.get(chave);
      const peso = maiorPeso(exercicio);
      const peso_valido = peso !== null && peso > 0 ? peso : null;
      const bateu = peso_valido !== null && peso_valido > (atual?.melhorPeso ?? 0);
      porExercicio.set(chave, {
        exercicioId: exercicio.exercicioId,
        nome: exercicio.nome,
        nomes: [...new Set([...(atual?.nomes ?? []), exercicio.nome])],
        vezes: (atual?.vezes ?? 0) + 1,
        ultimaData: sessao.iniciadaEm,
        melhorPeso: bateu ? peso_valido : (atual?.melhorPeso ?? null),
        melhorPesoData: bateu ? sessao.iniciadaEm : (atual?.melhorPesoData ?? null),
      });
    }
  }
  return [...porExercicio.values()].sort((a, b) => tempoIso(b.ultimaData) - tempoIso(a.ultimaData));
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

// ---------- Sugestão de treino ----------

export interface TreinoSugerido {
  treino: TreinoPersonalizado;
  /** Linha acima do nome: quando, ou de onde veio a sugestão. */
  contexto: string;
}

const quandoEm = (emDias: number, dia: string) => {
  if (emDias === 0) return "Hoje";
  if (emDias === 1) return "Amanhã";
  return dia;
};

/** A ordem natural da ficha: "Treino A", "Treino B", e "Treino 10" depois de "Treino 9". */
function naOrdemDaFicha(treinos: TreinoPersonalizado[]): TreinoPersonalizado[] {
  return [...treinos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { numeric: true }));
}

/** Quem treina A/B/C sem dia fixo: o seguinte ao último feito, voltando ao primeiro no fim. */
export function proximoDaSequencia(
  treinos: TreinoPersonalizado[],
  sessoes: Sessao[],
): TreinoPersonalizado | null {
  const ordem = naOrdemDaFicha(treinos);
  if (ordem.length === 0) return null;
  const recentes = [...finalizadas(sessoes)].sort((a, b) => dataDa(b).getTime() - dataDa(a).getTime());
  const ultimo = recentes.find((s) => ordem.some((t) => t.id === s.treinoId));
  if (!ultimo) return ordem[0];
  const posicao = ordem.findIndex((t) => t.id === ultimo.treinoId);
  return ordem[(posicao + 1) % ordem.length];
}

/** Toda conta com treino tem um próximo passo: pela agenda ou, sem ela, pela sequência. */
export function sugerirTreino(
  treinos: TreinoPersonalizado[],
  sessoes: Sessao[],
  agora: Date = new Date(),
): TreinoSugerido | null {
  const agendado = proximoTreino(treinos, sessoes, agora);
  if (agendado) {
    return { treino: agendado.treino, contexto: `Próximo treino · ${quandoEm(agendado.emDias, agendado.dia)}` };
  }
  const seguinte = proximoDaSequencia(treinos, sessoes);
  return seguinte && { treino: seguinte, contexto: "Próximo da sua sequência" };
}

// ---------- A semana em uma linha ----------

export interface DiaDaSemana {
  chave: string;
  inicial: string;
  nome: string;
  feito: boolean;
  previsto: boolean;
  hoje: boolean;
}

export function diasDaSemanaAtual(
  treinos: TreinoPersonalizado[],
  sessoes: Sessao[],
  agora: Date = new Date(),
): DiaDaSemana[] {
  const inicio = inicioDaSemana(agora);
  const hoje = chaveDiaLocal(agora);
  const feitos = new Set(finalizadas(sessoes).map((s) => chaveDiaLocal(dataDa(s))));
  const previstos = new Set(treinos.flatMap((t) => t.dias ?? []));
  return Array.from({ length: 7 }, (_, i) => {
    const data = somarDias(inicio, i);
    const chave = chaveDiaLocal(data);
    const nome = nomeDoDia(data);
    return {
      chave,
      nome,
      inicial: nome.charAt(0),
      feito: feitos.has(chave),
      previsto: previstos.has(nome),
      hoje: chave === hoje,
    };
  });
}

// ---------- Força estimada e recordes de repetições ----------

/** Acima disso, a fórmula de Epley perde a confiabilidade: é melhor não mostrar nada. */
const LIMITE_REPS_1RM = 12;

/** Estimativa de 1 repetição máxima (Epley). Serve para comparar treinos, não como carga a testar. */
export function rmEstimado(peso: number | null, reps: number | null): number | null {
  if (peso === null || peso <= 0 || reps === null || reps < 1 || reps > LIMITE_REPS_1RM) return null;
  if (reps === 1) return peso;
  return Math.round(peso * (1 + reps / 30) * 10) / 10;
}

export interface PontoRm {
  rotulo: string;
  valor: number;
}

/** O melhor 1RM estimado de cada treino, em ordem cronológica. */
export function pontosRmEstimado(sessoes: Sessao[], exercicioId: string, nome: string, limite = 30): PontoRm[] {
  const pontos = emOrdemCronologica(sessoes).flatMap((sessao) => {
    const valores = sessao.exercicios
      .filter((e) => e.exercicioId === exercicioId || e.nome === nome)
      .flatMap((e) => e.series)
      .filter((s) => s.concluida)
      .map((s) => rmEstimado(s.peso, s.reps))
      .filter((v): v is number => v !== null);
    if (valores.length === 0) return [];
    return [
      {
        rotulo: dataDa(sessao).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        valor: Math.max(...valores),
      },
    ];
  });
  return pontos.slice(-limite);
}

export interface RecordeRecente {
  nome: string;
  valor: string;
  anterior: string;
  data: string;
}

const emRepeticoes = (reps: number) => `${reps} reps`;

/** Quem treina com o próprio corpo evolui em repetições: carga nunca contaria o progresso. */
function recordesDeRepeticoes(sessoes: Sessao[]): RecordeRecente[] {
  const identidade = identificarExercicios(sessoes);
  const melhores = new Map<string, number>();
  const batidos: RecordeRecente[] = [];
  for (const sessao of emOrdemCronologica(sessoes)) {
    for (const exercicio of sessao.exercicios) {
      if (exercicio.medida !== "peso_corporal") continue;
      const semCarga = exercicio.series.filter((s) => s.concluida && (s.peso ?? 0) === 0 && s.reps !== null);
      if (semCarga.length === 0) continue;
      const maior = Math.max(...semCarga.map((s) => s.reps as number));
      const chave = identidade(exercicio);
      const melhor = melhores.get(chave);
      if (melhor !== undefined && maior > melhor) {
        batidos.push({
          nome: exercicio.nome,
          valor: emRepeticoes(maior),
          anterior: emRepeticoes(melhor),
          data: sessao.iniciadaEm,
        });
      }
      if (melhor === undefined || maior > melhor) melhores.set(chave, maior);
    }
  }
  return batidos;
}

/** Recordes de carga e de repetições juntos, mais recente primeiro. */
export function recordesRecentes(sessoes: Sessao[]): RecordeRecente[] {
  const deCarga = recordesBatidos(sessoes).map((r) => ({
    nome: r.nome,
    valor: formatarKg(r.peso),
    anterior: formatarKg(r.anterior),
    data: r.data,
  }));
  return [...deCarga, ...recordesDeRepeticoes(sessoes)].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime(),
  );
}

// ---------- Equilíbrio entre grupos musculares ----------

export interface SeriesDoGrupo {
  id: string;
  rotulo: string;
  series: number;
}

/** Séries feitas nos últimos `dias`, pelo músculo principal de cada exercício. */
export function seriesPorGrupo(sessoes: Sessao[], dias: number, agora: Date = new Date()): SeriesDoGrupo[] {
  const fim = somarDias(agora, 1);
  const contagem = new Map<string, number>();
  for (const sessao of entre(sessoes, somarDias(fim, -dias), fim)) {
    for (const exercicio of sessao.exercicios) {
      const feitas = exercicio.series.filter((s) => s.concluida).length;
      if (feitas === 0) continue;
      const grupo = GRUPOS_MUSCULARES.find((g) =>
        exercicio.primaryMuscles.some((m) => g.musculos.includes(m)),
      );
      // Registros antigos podem não ter músculo: não são encaixados em um grupo por palpite.
      const id = exercicio.medida === "distancia" ? "cardio" : (grupo?.id ?? "outros");
      contagem.set(id, (contagem.get(id) ?? 0) + feitas);
    }
  }
  const rotulos = new Map(GRUPOS_MUSCULARES.map((g) => [g.id, g.rotulo]));
  return [...contagem.entries()]
    .map(([id, series]) => ({ id, rotulo: rotulos.get(id) ?? "Outros", series }))
    .sort((a, b) => b.series - a.series);
}
