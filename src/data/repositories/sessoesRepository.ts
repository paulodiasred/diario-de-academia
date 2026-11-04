import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firestore";
import type { Sessao } from "@/domain/sessao";
import { paraIso } from "./registrosRepository";

const colecaoSessoes = (uid: string) => collection(db, "users", uid, "sessions");
const docRascunho = (uid: string) => doc(db, "users", uid, "activeSession", "current");

export function novoIdDeSessao(uid: string): string {
  return doc(colecaoSessoes(uid)).id;
}

/** Sessão finalizada como documento: os campos de andamento não vão para o histórico. */
export function sessaoParaDocumento(sessao: Sessao): DocumentData {
  const { id: _id, exercicioAtual: _atual, descanso: _descanso, ...dados } = sessao;
  return {
    ...dados,
    iniciadaEm: Timestamp.fromDate(new Date(sessao.iniciadaEm)),
    finalizadaEm: Timestamp.fromDate(new Date(sessao.finalizadaEm as string)),
  };
}

function documentoParaSessao(id: string, dados: DocumentData): Sessao {
  return {
    ...(dados as Sessao),
    id,
    iniciadaEm: paraIso(dados.iniciadaEm),
    finalizadaEm: paraIso(dados.finalizadaEm),
    exercicioAtual: 0,
    descanso: null,
  };
}

export async function listarSessoes(uid: string): Promise<Sessao[]> {
  const snap = await getDocs(colecaoSessoes(uid));
  return snap.docs
    .map((d) => documentoParaSessao(d.id, d.data()))
    .sort((a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime());
}

export async function sessaoJaFinalizada(uid: string, id: string): Promise<boolean> {
  return (await getDoc(doc(colecaoSessoes(uid), id))).exists();
}

/** Grava o histórico e apaga o rascunho juntos: nunca ficam os dois, nem nenhum. */
export function gravarSessaoFinalizada(uid: string, sessao: Sessao): Promise<void> {
  const lote = writeBatch(db);
  lote.set(doc(colecaoSessoes(uid), sessao.id), sessaoParaDocumento(sessao));
  lote.delete(docRascunho(uid));
  return lote.commit();
}

// ---------- Treino em andamento ----------

export async function lerRascunhoRemoto(uid: string): Promise<Sessao | null> {
  const snap = await getDoc(docRascunho(uid));
  return snap.exists() ? (snap.data() as Sessao) : null;
}

export function gravarRascunhoRemoto(uid: string, sessao: Sessao): Promise<void> {
  return setDoc(docRascunho(uid), sessao);
}

export function apagarRascunhoRemoto(uid: string): Promise<void> {
  return deleteDoc(docRascunho(uid));
}
