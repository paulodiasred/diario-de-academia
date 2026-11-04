import {
  doc,
  getDoc,
  increment,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PLANO_GRATUITO, type Assinatura, type Contadores, type RecursoLimitado } from "@/domain/planos";
import { paraIso } from "./registrosRepository";

/** Só o servidor grava em `entitlements`: as regras recusam qualquer escrita do cliente. */
export async function lerAssinatura(uid: string): Promise<Assinatura> {
  const dados = (await getDoc(doc(db, "entitlements", uid))).data();
  if (!dados) return PLANO_GRATUITO;
  return {
    plano: dados.plano === "premium" ? "premium" : "gratuito",
    expiraEm: dados.expiraEm ? paraIso(dados.expiraEm) : null,
  };
}

const refContadores = (uid: string) => doc(db, "users", uid, "uso", "contadores");

export async function lerContadores(uid: string): Promise<Contadores> {
  const dados = (await getDoc(refContadores(uid))).data();
  return { treinos: dados?.treinos ?? 0, exercicios: dados?.exercicios ?? 0 };
}

/** O contador só muda no mesmo lote da criação ou exclusão: as regras conferem os dois juntos. */
export function ajustarContadorNoLote(
  lote: WriteBatch,
  uid: string,
  recurso: RecursoLimitado,
  delta: 1 | -1,
  documentoId: string,
): void {
  lote.set(refContadores(uid), { [recurso]: increment(delta), ultimoId: documentoId }, { merge: true });
}
