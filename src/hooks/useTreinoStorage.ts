import { useState, useEffect, useCallback } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TreinoRegistro } from "@/data/treino";
import { useAuth } from "./useAuth";

export function useTreinoStorage() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<TreinoRegistro[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRegistros = useCallback(async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "registros"),
        where("userId", "==", user.uid),
        orderBy("data", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        data: doc.data().data?.toDate?.()?.toISOString() || doc.data().data
      })) as TreinoRegistro[];
      setRegistros(data);
    } catch (error) {
      console.error("Erro ao carregar registros:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRegistros();
    } else {
      setRegistros([]);
      setLoading(false);
    }
  }, [user, loadRegistros]);

  const salvarRegistro = async (registro: Omit<TreinoRegistro, "id" | "data" | "userId">): Promise<TreinoRegistro> => {
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const docRef = await addDoc(collection(db, "registros"), {
        ...registro,
        userId: user.uid,
        data: Timestamp.now(),
        concluida: registro.concluida ?? true
      });

      const novoRegistro: TreinoRegistro = {
        id: docRef.id,
        ...registro,
        userId: user.uid,
        data: new Date().toISOString(),
        concluida: registro.concluida ?? true
      };

      setRegistros(prev => [novoRegistro, ...prev]); // Add to beginning since ordered by date desc
      return novoRegistro;
    } catch (error) {
      console.error("Erro ao salvar registro:", error);
      throw error;
    }
  };

  const getRegistrosPorExercicio = (exercicio: string) => {
    return registros.filter((r) => r.exercicio === exercicio);
  };

  const getUltimoPeso = (exercicio: string): number | null => {
    const regs = getRegistrosPorExercicio(exercicio);
    if (regs.length === 0) return null;
    return regs.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0].peso;
  };

  const getHistorico = (exercicio: string, limit = 6) => {
    return getRegistrosPorExercicio(exercicio)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, limit);
  };

  return {
    registros,
    loading,
    salvarRegistro,
    getRegistrosPorExercicio,
    getUltimoPeso,
    getHistorico,
    reloadRegistros: loadRegistros,
  };
}
