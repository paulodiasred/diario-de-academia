import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TreinoRegistro } from "@/data/treino";

export function paraIso(valor: unknown): string {
  const comData = valor as { toDate?: () => Date } | null | undefined;
  return comData?.toDate?.().toISOString() ?? (valor as string);
}

/**
 * Registros antigos, uma série por documento. Só são lidos para a migração:
 * o app não grava nem apaga mais nada nesta coleção.
 */
export async function listarRegistrosLegados(uid: string): Promise<TreinoRegistro[]> {
  const snap = await getDocs(query(collection(db, "registros"), where("userId", "==", uid)));
  return snap.docs.map((d) => {
    const dados = d.data();
    return { ...dados, id: d.id, data: paraIso(dados.data) } as TreinoRegistro;
  });
}
