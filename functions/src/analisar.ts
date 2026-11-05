import {
  montarDadosDaAnalise,
  temTreinosSuficientes,
  MINIMO_DE_TREINOS,
  DIAS_DA_ANALISE,
  type DadosDaAnalise,
  type RespostaDaAnalise,
} from "@/domain/analiseTreinos";
import type { Sessao } from "@/domain/sessao";
import { ErroDaIA } from "./erros";

export interface DependenciasDaAnalise {
  temPremium(uid: string, agora: Date): Promise<boolean>;
  lerSessoes(uid: string): Promise<Sessao[]>;
  /** Falso quando a cota do mês acabou. */
  reservarCota(uid: string, agora: Date): Promise<boolean>;
  devolverCota(uid: string, agora: Date): Promise<void>;
  gerar(dados: DadosDaAnalise): Promise<{ analise: RespostaDaAnalise; modelo: string }>;
  salvar(uid: string, analise: RespostaDaAnalise, modelo: string, agora: Date): Promise<void>;
}

export interface PedidoDeAnalise {
  uid: string;
  consentiu: boolean;
  agora: Date;
}

/**
 * Confere tudo antes de gastar: consentimento, plano, dados e cota, nesta ordem. A cota é
 * reservada antes da chamada, para pedidos simultâneos não passarem do limite, e devolvida
 * se a análise não chegar à pessoa.
 */
export async function analisarTreinos(
  { uid, consentiu, agora }: PedidoDeAnalise,
  deps: DependenciasDaAnalise,
): Promise<RespostaDaAnalise> {
  if (!consentiu) {
    throw new ErroDaIA("failed-precondition", "Confirme o envio dos dados para gerar a análise.");
  }
  if (!(await deps.temPremium(uid, agora))) {
    throw new ErroDaIA("permission-denied", "A análise com IA faz parte do Premium.");
  }

  const sessoes = await deps.lerSessoes(uid);
  if (!temTreinosSuficientes(sessoes, agora)) {
    throw new ErroDaIA(
      "failed-precondition",
      `Faça pelo menos ${MINIMO_DE_TREINOS} treinos em ${DIAS_DA_ANALISE} dias para gerar uma análise.`,
    );
  }

  if (!(await deps.reservarCota(uid, agora))) {
    throw new ErroDaIA("resource-exhausted", "Você já usou todas as análises deste mês.");
  }

  try {
    const { analise, modelo } = await deps.gerar(montarDadosDaAnalise(sessoes, agora));
    await deps.salvar(uid, analise, modelo, agora);
    return analise;
  } catch (erro) {
    await deps.devolverCota(uid, agora);
    throw erro;
  }
}
