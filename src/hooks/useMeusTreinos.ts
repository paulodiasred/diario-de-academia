import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import type { TreinoPersonalizado } from "@/types/catalogo";

export function useMeusTreinos() {
  const { user } = useAuth();
  const [treinos, setTreinos] = useState<TreinoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarTreinos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let data: TreinoPersonalizado[] = [];
      try {
        const q = query(
          collection(db, "treinos"),
          where("userId", "==", user.uid),
          orderBy("criadoEm", "desc")
        );
        const snap = await getDocs(q);
        data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          criadoEm:
            d.data().criadoEm?.toDate?.()?.toISOString() ||
            d.data().criadoEm,
          atualizadoEm:
            d.data().atualizadoEm?.toDate?.()?.toISOString() ||
            d.data().atualizadoEm,
        })) as TreinoPersonalizado[];
      } catch {
        const q = query(
          collection(db, "treinos"),
          where("userId", "==", user.uid)
        );
        const snap = await getDocs(q);
        data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          criadoEm:
            d.data().criadoEm?.toDate?.()?.toISOString() ||
            d.data().criadoEm,
          atualizadoEm:
            d.data().atualizadoEm?.toDate?.()?.toISOString() ||
            d.data().atualizadoEm,
        })) as TreinoPersonalizado[];
        data.sort(
          (a, b) =>
            new Date(b.criadoEm ?? 0).getTime() -
            new Date(a.criadoEm ?? 0).getTime()
        );
      }
      setTreinos(data);
    } catch (e) {
      console.error("Erro ao carregar treinos:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) carregarTreinos();
    else {
      setTreinos([]);
      setLoading(false);
    }
  }, [user, carregarTreinos]);

  const criarTreino = async (
    dados: Omit<TreinoPersonalizado, "id" | "userId" | "criadoEm" | "atualizadoEm">
  ): Promise<string> => {
    if (!user) throw new Error("Não autenticado");
    const docRef = await addDoc(collection(db, "treinos"), {
      ...dados,
      userId: user.uid,
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    });
    await carregarTreinos();
    return docRef.id;
  };

  const atualizarTreino = async (
    id: string,
    dados: Partial<Omit<TreinoPersonalizado, "id" | "userId">>
  ) => {
    await updateDoc(doc(db, "treinos", id), {
      ...dados,
      atualizadoEm: Timestamp.now(),
    });
    await carregarTreinos();
  };

  const deletarTreino = async (id: string) => {
    await deleteDoc(doc(db, "treinos", id));
    setTreinos((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    treinos,
    loading,
    criarTreino,
    atualizarTreino,
    deletarTreino,
    recarregar: carregarTreinos,
  };
}
