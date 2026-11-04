import { collection, doc, getDocs, setDoc, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firestore";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { normalizarExercicioProprio, type ExercicioProprioInput } from "@/domain/schemas";
import { ajustarContadorNoLote } from "./planoRepository";

const colecao = (uid: string) => collection(db, "users", uid, "exercises");

/** O prefixo evita colisão com os IDs do catálogo nos treinos e no histórico. */
const PREFIXO_ID = "proprio-";
const paraIdExercicio = (docId: string) => PREFIXO_ID + docId;
const paraDocId = (id: string) => id.slice(PREFIXO_ID.length);

function paraCatalogo(id: string, dados: ReturnType<typeof normalizarExercicioProprio>): ExercicioCatalogo {
  return {
    ...dados,
    id,
    force: null,
    level: "beginner",
    mechanic: null,
    images: [],
    secondaryMuscles: dados.secondaryMuscles,
    instructions: dados.instructions,
    proprio: true,
  };
}

export async function listarExerciciosProprios(uid: string): Promise<ExercicioCatalogo[]> {
  const snap = await getDocs(colecao(uid));
  return snap.docs
    .map((d) =>
      paraCatalogo(paraIdExercicio(d.id), d.data() as ReturnType<typeof normalizarExercicioProprio>),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function salvarExercicioProprio(uid: string, input: ExercicioProprioInput, id?: string) {
  const dados = normalizarExercicioProprio(input);
  const agora = Timestamp.now();

  if (id) {
    const ref = doc(colecao(uid), paraDocId(id));
    return {
      exercicio: paraCatalogo(id, dados),
      confirmacao: setDoc(ref, { ...dados, atualizadoEm: agora }),
    };
  }

  const ref = doc(colecao(uid));
  const lote = writeBatch(db);
  lote.set(ref, { ...dados, atualizadoEm: agora });
  ajustarContadorNoLote(lote, uid, "exercicios", 1, ref.id);
  return { exercicio: paraCatalogo(paraIdExercicio(ref.id), dados), confirmacao: lote.commit() };
}

export function excluirExercicioProprio(uid: string, id: string, descontar: boolean): Promise<void> {
  const docId = paraDocId(id);
  const lote = writeBatch(db);
  lote.delete(doc(colecao(uid), docId));
  if (descontar) ajustarContadorNoLote(lote, uid, "exercicios", -1, docId);
  return lote.commit();
}
