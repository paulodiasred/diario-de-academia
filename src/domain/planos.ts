/**
 * Limites do plano gratuito. Espelhados em firestore.rules, que é quem os garante:
 * aqui eles só servem para a tela avisar antes. Altere os dois juntos.
 */
export const LIMITES_GRATUITO = {
  treinos: 4,
  exercicios: 10,
} as const;

/** Garantida pela Cloud Function, que é quem paga cada análise. */
export const COTA_MENSAL_DE_ANALISES = 10;

export type RecursoLimitado = keyof typeof LIMITES_GRATUITO;

export interface Assinatura {
  plano: "gratuito" | "premium";
  /** ISO. null: sem data de fim (Premium concedido manualmente no beta). */
  expiraEm: string | null;
}

export const PLANO_GRATUITO: Assinatura = { plano: "gratuito", expiraEm: null };

export function temPremium(assinatura: Assinatura, agora: Date = new Date()): boolean {
  if (assinatura.plano !== "premium") return false;
  return assinatura.expiraEm === null || new Date(assinatura.expiraEm) > agora;
}

export type Contadores = Record<RecursoLimitado, number>;

export function podeCriar(recurso: RecursoLimitado, premium: boolean, contadores: Contadores): boolean {
  return premium || contadores[recurso] < LIMITES_GRATUITO[recurso];
}

const NOME_RECURSO: Record<RecursoLimitado, string> = {
  treinos: "treinos",
  exercicios: "exercícios próprios",
};

export class LimiteDoPlano extends Error {
  constructor(recurso: RecursoLimitado) {
    super(
      `O plano gratuito permite ${LIMITES_GRATUITO[recurso]} ${NOME_RECURSO[recurso]}. Exclua um ou conheça o Premium.`,
    );
    this.name = "LimiteDoPlano";
  }
}

/** Fora da lista até a função de IA ser publicada: a tabela só mostra o que existe de verdade. */
export const LINHA_ANALISE_IA = {
  recurso: "Análise dos treinos com IA",
  gratuito: "Não",
  premium: `Até ${COTA_MENSAL_DE_ANALISES} por mês`,
};

/** Comparação mostrada na tela de planos. Só lista o que existe de verdade no app. */
export const COMPARACAO_PLANOS: Array<{ recurso: string; gratuito: string; premium: string }> = [
  { recurso: "Registro de séries, cargas e descanso", gratuito: "Incluído", premium: "Incluído" },
  { recurso: "Biblioteca de exercícios", gratuito: "Incluída", premium: "Incluída" },
  { recurso: "Treinos", gratuito: `Até ${LIMITES_GRATUITO.treinos}`, premium: "Sem limite" },
  { recurso: "Exercícios próprios", gratuito: `Até ${LIMITES_GRATUITO.exercicios}`, premium: "Sem limite" },
  { recurso: "Meta semanal e calendário", gratuito: "Incluídos", premium: "Incluídos" },
  { recurso: "Exportar todos os seus dados", gratuito: "Incluído", premium: "Incluído" },
  { recurso: "Comparação entre períodos", gratuito: "7 dias", premium: "7, 30 e 90 dias" },
  { recurso: "Volume por semana", gratuito: "Incluído", premium: "Incluído" },
  { recurso: "1RM estimado por exercício", gratuito: "Não", premium: "Incluído" },
  { recurso: "Séries por grupo muscular", gratuito: "Não", premium: "Incluído" },
  { recurso: "Histórico por exercício", gratuito: "Últimos 5 treinos", premium: "Completo" },
  { recurso: "Gráfico de carga por exercício", gratuito: "Últimos 10 treinos", premium: "Últimos 30 treinos" },
  { recurso: "Metas personalizadas", gratuito: "Não", premium: "Incluídas" },
  { recurso: "Conquistas", gratuito: "Básicas", premium: "Todas" },
  { recurso: "Relatório por exercício", gratuito: "Não", premium: "Incluído" },
];
