import { maiorSequenciaDeSemanas, recordesBatidos, resumirSessoes } from "./estatisticas";
import type { Sessao } from "./sessao";

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  atual: number;
  alvo: number;
  obtida: boolean;
  /** Avançada: só conta no Premium. */
  premium: boolean;
}

/** Sempre calculadas a partir dos treinos: não há o que falsificar nem o que sair de sincronia. */
export function calcularConquistas(sessoes: Sessao[]): Conquista[] {
  const finalizadas = sessoes.filter((s) => s.finalizadaEm);
  const resumo = resumirSessoes(finalizadas);
  const recordes = recordesBatidos(finalizadas).length;
  const semanas = maiorSequenciaDeSemanas(finalizadas);

  const definicoes: Array<Omit<Conquista, "obtida">> = [
    { id: "primeiro-treino", titulo: "Primeiro treino", descricao: "Finalize 1 treino", atual: resumo.treinos, alvo: 1, premium: false },
    { id: "10-treinos", titulo: "Pegando o ritmo", descricao: "Finalize 10 treinos", atual: resumo.treinos, alvo: 10, premium: false },
    { id: "primeiro-recorde", titulo: "Novo patamar", descricao: "Bata 1 recorde de carga", atual: recordes, alvo: 1, premium: false },
    { id: "4-semanas", titulo: "Um mês firme", descricao: "Treine 4 semanas seguidas", atual: semanas, alvo: 4, premium: false },
    { id: "50-treinos", titulo: "Hábito formado", descricao: "Finalize 50 treinos", atual: resumo.treinos, alvo: 50, premium: true },
    { id: "100-treinos", titulo: "Centena", descricao: "Finalize 100 treinos", atual: resumo.treinos, alvo: 100, premium: true },
    { id: "12-semanas", titulo: "Três meses firme", descricao: "Treine 12 semanas seguidas", atual: semanas, alvo: 12, premium: true },
    { id: "10-recordes", titulo: "Em evolução", descricao: "Bata 10 recordes de carga", atual: recordes, alvo: 10, premium: true },
    { id: "10-toneladas", titulo: "10 toneladas", descricao: "Levante 10.000 kg de volume", atual: resumo.volumeKg, alvo: 10_000, premium: true },
    { id: "100-toneladas", titulo: "100 toneladas", descricao: "Levante 100.000 kg de volume", atual: resumo.volumeKg, alvo: 100_000, premium: true },
  ];

  return definicoes.map((d) => ({ ...d, obtida: d.atual >= d.alvo }));
}
