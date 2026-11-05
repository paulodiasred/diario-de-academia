import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { usadasNoMes, type RecursoDeIA, type RespostaDaAnalise } from "@/domain/analiseTreinos";
import type { PreferenciasFicha } from "@/domain/fichaIA";
import type { ModeloTreino } from "@/domain/modelosTreino";
import { db } from "@/lib/firestore";
import { chamarFuncao } from "@/lib/funcoes";
import { paraIso } from "./registrosRepository";

export interface AnaliseGuardada extends RespostaDaAnalise {
  criadaEm: string;
}

const refAnalise = (uid: string) => doc(db, "users", uid, "analises", "ultima");

export async function lerAnalise(uid: string): Promise<AnaliseGuardada | null> {
  const snap = await getDoc(refAnalise(uid));
  if (!snap.exists()) return null;
  const dados = snap.data();
  return {
    resumo: dados.resumo,
    evolucao: dados.evolucao ?? [],
    atencao: dados.atencao ?? [],
    sugestoes: dados.sugestoes ?? [],
    criadaEm: paraIso(dados.criadaEm),
  };
}

export function apagarAnalise(uid: string): Promise<void> {
  return deleteDoc(refAnalise(uid));
}

/** Análises e fichas usadas neste mês. */
export async function lerUsoDeIA(uid: string): Promise<Record<RecursoDeIA, number>> {
  const snap = await getDoc(doc(db, "users", uid, "uso", "ia"));
  const uso = snap.exists() ? snap.data() : null;
  return { analises: usadasNoMes(uso, "analises"), fichas: usadasNoMes(uso, "fichas") };
}

export async function lerAnalisesUsadas(uid: string): Promise<number> {
  return (await lerUsoDeIA(uid)).analises;
}

export function pedirAnalise(): Promise<unknown> {
  return chamarFuncao("analisarMeusTreinos", { consentiu: true });
}

export function pedirFicha(preferencias: PreferenciasFicha): Promise<ModeloTreino> {
  return chamarFuncao("montarMinhaFicha", { consentiu: true, preferencias });
}
