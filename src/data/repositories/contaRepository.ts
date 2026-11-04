import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
} from "firebase/firestore";
import { db } from "@/lib/firestore";
import { listarExerciciosProprios } from "./exerciciosRepository";
import { listarMetas } from "./metasRepository";
import { listarRegistrosLegados } from "./registrosRepository";
import { listarSessoes } from "./sessoesRepository";
import { listarTreinos } from "./treinosRepository";
import { lerPerfil } from "./usuariosRepository";

const TAMANHO_LOTE = 400;

/** Tudo o que o app guarda sobre a conta, em um arquivo: acesso e portabilidade (LGPD). */
export async function montarExportacaoCompleta(uid: string, email: string | null) {
  const [perfil, sessoes, treinos, exercicios, metas, registrosAntigos] = await Promise.all([
    lerPerfil(uid),
    listarSessoes(uid),
    listarTreinos(uid),
    listarExerciciosProprios(uid),
    listarMetas(uid),
    listarRegistrosLegados(uid),
  ]);
  return {
    formato: "diario-de-academia",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    conta: { email },
    perfil,
    treinos,
    sessoes,
    exerciciosProprios: exercicios,
    metas,
    registrosAntigos,
  };
}

/**
 * Apaga os dados da conta. `uso/contadores` fica: as regras não deixam apagar, senão
 * apagar o contador burlaria o limite do plano. Só tem números e um ID, sem dado de treino,
 * e deve sair com uma Cloud Function ao excluir a conta (pendência da Fase 6).
 */
export async function excluirDadosDaConta(uid: string): Promise<void> {
  const [registros, treinos, sessoes, exercicios, metas] = await Promise.all([
    getDocs(query(collection(db, "registros"), where("userId", "==", uid))),
    getDocs(query(collection(db, "treinos"), where("userId", "==", uid))),
    getDocs(collection(db, "users", uid, "sessions")),
    getDocs(collection(db, "users", uid, "exercises")),
    getDocs(collection(db, "users", uid, "metas")),
  ]);

  const alvos: DocumentReference[] = [
    ...[registros, treinos, sessoes, exercicios, metas].flatMap((snap) => snap.docs.map((d) => d.ref)),
    doc(db, "users", uid, "activeSession", "current"),
    doc(db, "users", uid),
  ];

  for (let i = 0; i < alvos.length; i += TAMANHO_LOTE) {
    const lote = writeBatch(db);
    alvos.slice(i, i + TAMANHO_LOTE).forEach((ref) => lote.delete(ref));
    await lote.commit();
  }
}
