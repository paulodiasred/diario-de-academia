import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TreinoRegistro } from "@/data/treino";
import { ordenarMaisRecentes } from "@/domain/registros";
import { normalizarRegistro, type RegistroInput } from "@/domain/schemas";

export function paraIso(valor: unknown): string {
  const comData = valor as { toDate?: () => Date } | null | undefined;
  return comData?.toDate?.().toISOString() ?? (valor as string);
}

/** Sem orderBy para não depender de índice composto: a ordenação acontece aqui. */
export async function listarRegistros(uid: string): Promise<TreinoRegistro[]> {
  const snap = await getDocs(query(collection(db, "registros"), where("userId", "==", uid)));
  const registros = snap.docs.map((d) => {
    const dados = d.data();
    return { ...dados, id: d.id, data: paraIso(dados.data) } as TreinoRegistro;
  });
  return ordenarMaisRecentes(registros);
}

export interface GravacaoRegistro {
  registro: TreinoRegistro;
  /** Só termina quando o servidor confirma. Não deve bloquear a tela: sem sinal, fica pendente. */
  confirmacao: Promise<void>;
}

export function criarRegistro(uid: string, input: RegistroInput): GravacaoRegistro {
  const dados = normalizarRegistro(input);
  const ref = doc(collection(db, "registros"));
  const agora = Timestamp.now();
  return {
    registro: { ...dados, id: ref.id, userId: uid, data: agora.toDate().toISOString() },
    confirmacao: setDoc(ref, { ...dados, userId: uid, data: agora }),
  };
}

export function excluirRegistro(id: string): Promise<void> {
  return deleteDoc(doc(db, "registros", id));
}
