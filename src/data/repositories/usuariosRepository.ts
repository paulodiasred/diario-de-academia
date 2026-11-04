import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Exercício do catálogo que a pessoa escolheu como referência para um nome antigo. */
export interface VinculoExercicio {
  exercicioId: string;
  imagem: string | null;
}

export interface Perfil {
  /** Treinos por semana. Ausente até o usuário definir: nenhuma meta é assumida. */
  metaSemanal: number | null;
  /** Chave: `slug` do nome do exercício. */
  vinculos: Record<string, VinculoExercicio>;
}

export async function lerPerfil(uid: string): Promise<Perfil> {
  const dados = (await getDoc(doc(db, "users", uid))).data();
  return {
    metaSemanal: dados?.metaSemanal ?? null,
    vinculos: dados?.vinculosExercicios ?? {},
  };
}

export function salvarMetaSemanal(uid: string, metaSemanal: number): Promise<void> {
  return setDoc(doc(db, "users", uid), { metaSemanal }, { merge: true });
}

export function salvarVinculo(uid: string, chave: string, vinculo: VinculoExercicio): Promise<void> {
  return setDoc(doc(db, "users", uid), { vinculosExercicios: { [chave]: vinculo } }, { merge: true });
}
