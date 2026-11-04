import {
  collection,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TreinoPersonalizado } from "@/types/catalogo";
import { normalizarTreino, type TreinoInput } from "@/domain/schemas";
import { ajustarContadorNoLote } from "./planoRepository";
import { paraIso } from "./registrosRepository";

export async function listarTreinos(uid: string): Promise<TreinoPersonalizado[]> {
  const snap = await getDocs(query(collection(db, "treinos"), where("userId", "==", uid)));
  const treinos = snap.docs.map((d) => {
    const dados = d.data();
    return {
      ...dados,
      id: d.id,
      criadoEm: paraIso(dados.criadoEm),
      atualizadoEm: paraIso(dados.atualizadoEm),
    } as TreinoPersonalizado;
  });
  return treinos.sort(
    (a, b) => new Date(b.criadoEm ?? 0).getTime() - new Date(a.criadoEm ?? 0).getTime(),
  );
}

export interface GravacaoTreino {
  treino: TreinoPersonalizado;
  /** Só termina quando o servidor confirma. Não deve bloquear a tela: sem sinal, fica pendente. */
  confirmacao: Promise<void>;
}

export function criarTreino(uid: string, input: TreinoInput): GravacaoTreino {
  const dados = normalizarTreino(input);
  const ref = doc(collection(db, "treinos"));
  const agora = Timestamp.now();
  const iso = agora.toDate().toISOString();

  const lote = writeBatch(db);
  lote.set(ref, { ...dados, userId: uid, criadoEm: agora, atualizadoEm: agora });
  ajustarContadorNoLote(lote, uid, "treinos", 1, ref.id);

  return {
    treino: { ...dados, id: ref.id, userId: uid, criadoEm: iso, atualizadoEm: iso },
    confirmacao: lote.commit(),
  };
}

export function atualizarTreino(id: string, input: TreinoInput) {
  const dados = normalizarTreino(input);
  const agora = Timestamp.now();
  return {
    dados: { ...dados, atualizadoEm: agora.toDate().toISOString() },
    confirmacao: updateDoc(doc(db, "treinos", id), { ...dados, atualizadoEm: agora }),
  };
}

/** `descontar`: devolve a vaga do plano. Treinos antigos e migrados nunca ocuparam uma. */
export function excluirTreino(uid: string, id: string, descontar: boolean): Promise<void> {
  const lote = writeBatch(db);
  lote.delete(doc(db, "treinos", id));
  if (descontar) ajustarContadorNoLote(lote, uid, "treinos", -1, id);
  return lote.commit();
}
