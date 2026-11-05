import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { analisesUsadas, type RespostaDaAnalise } from "@/domain/analiseTreinos";
import { app, usarEmulador } from "@/lib/firebase";
import { db } from "@/lib/firestore";
import { paraIso } from "./registrosRepository";

const REGIAO = "southamerica-east1";

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

export async function lerAnalisesUsadas(uid: string): Promise<number> {
  const snap = await getDoc(doc(db, "users", uid, "uso", "ia"));
  return analisesUsadas(snap.exists() ? snap.data() : null);
}

/** O SDK de funções só carrega aqui: quem não usa a análise não baixa esse código. */
export async function pedirAnalise(): Promise<void> {
  const { connectFunctionsEmulator, getFunctions, httpsCallable } = await import("firebase/functions");
  const funcoes = getFunctions(app, REGIAO);
  if (usarEmulador) connectFunctionsEmulator(funcoes, "127.0.0.1", 5001);
  await httpsCallable(funcoes, "analisarMeusTreinos", { timeout: 120_000 })({ consentiu: true });
}
