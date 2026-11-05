import {
  AVISO_RESTRICAO,
  candidatosDaFicha,
  preferenciasFichaSchema,
  type ExercicioCandidato,
  type PreferenciasFicha,
} from "@/domain/fichaIA";
import type { ModeloTreino } from "@/domain/modelosTreino";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { ErroDaIA } from "./erros";

export interface DependenciasDaFicha {
  catalogo: ExercicioCatalogo[];
  temPremium(uid: string, agora: Date): Promise<boolean>;
  /** Falso quando a cota do mês acabou. */
  reservarCota(uid: string, agora: Date): Promise<boolean>;
  devolverCota(uid: string, agora: Date): Promise<void>;
  gerar(preferencias: PreferenciasFicha, candidatos: ExercicioCandidato[]): Promise<ModeloTreino>;
}

export interface PedidoDeFicha {
  uid: string;
  consentiu: boolean;
  preferencias: unknown;
  agora: Date;
}

/**
 * A ficha volta para a pessoa revisar, e só é salva se ela quiser, pelo caminho normal do app:
 * o limite de treinos do plano continua valendo nas regras do Firestore.
 */
export async function montarFicha(
  { uid, consentiu, preferencias, agora }: PedidoDeFicha,
  deps: DependenciasDaFicha,
): Promise<ModeloTreino> {
  if (!consentiu) {
    throw new ErroDaIA("failed-precondition", "Confirme o envio das respostas para montar a ficha.");
  }
  const lidas = preferenciasFichaSchema.safeParse(preferencias);
  if (!lidas.success) throw new ErroDaIA("invalid-argument", "Responda todas as perguntas para montar a ficha.");
  if (lidas.data.restricao) throw new ErroDaIA("failed-precondition", AVISO_RESTRICAO);

  if (!(await deps.temPremium(uid, agora))) {
    throw new ErroDaIA("permission-denied", "A ficha montada por IA faz parte do Premium.");
  }
  if (!(await deps.reservarCota(uid, agora))) {
    throw new ErroDaIA("resource-exhausted", "Você já montou todas as fichas deste mês.");
  }

  try {
    return await deps.gerar(lidas.data, candidatosDaFicha(deps.catalogo, lidas.data.local));
  } catch (erro) {
    await deps.devolverCota(uid, agora);
    throw erro;
  }
}
