import { collection, deleteDoc, doc, getDocs, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firestore";
import type { Meta, TipoMeta } from "@/domain/metas";

const colecao = (uid: string) => collection(db, "users", uid, "metas");

export async function listarMetas(uid: string): Promise<Meta[]> {
  const snap = await getDocs(colecao(uid));
  return snap.docs.map((d) => {
    const dados = d.data();
    return {
      id: d.id,
      tipo: dados.tipo as TipoMeta,
      alvo: dados.alvo as number,
      exercicioNome: (dados.exercicioNome as string | undefined) ?? null,
    };
  });
}

export function criarMeta(uid: string, dados: Omit<Meta, "id">) {
  const ref = doc(colecao(uid));
  const documento = {
    tipo: dados.tipo,
    alvo: dados.alvo,
    criadaEm: Timestamp.now(),
    ...(dados.exercicioNome ? { exercicioNome: dados.exercicioNome } : {}),
  };
  return { meta: { ...dados, id: ref.id }, confirmacao: setDoc(ref, documento) };
}

export function excluirMeta(uid: string, id: string): Promise<void> {
  return deleteDoc(doc(colecao(uid), id));
}
