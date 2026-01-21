import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TreinoRegistro } from "@/data/treino";

export function useTreinoStorage() {
  const [registros, setRegistros] = useState<TreinoRegistro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegistros();
  }, []);

  const loadRegistros = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "registros"));
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
  };

  const salvarRegistro = async (registro: Omit<TreinoRegistro, "id" | "data">): Promise<TreinoRegistro> => {
    try {
      const docRef = await addDoc(collection(db, "registros"), {
        ...registro,
        data: Timestamp.now(),
        concluida: registro.concluida ?? true
      });

      const novoRegistro: TreinoRegistro = {
        id: docRef.id,
        ...registro,
        data: new Date().toISOString(),
        concluida: registro.concluida ?? true
      };

      setRegistros(prev => [...prev, novoRegistro]);
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
