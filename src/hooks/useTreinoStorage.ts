import { useState, useEffect } from "react";
import { TreinoRegistro } from "@/data/treino";

const STORAGE_KEY = "treino-registros";

export function useTreinoStorage() {
  const [registros, setRegistros] = useState<TreinoRegistro[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setRegistros(JSON.parse(stored));
    }
  }, []);

  const salvarRegistro = (registro: Omit<TreinoRegistro, "id" | "data">) => {
    const novoRegistro: TreinoRegistro = {
      ...registro,
      id: crypto.randomUUID(),
      data: new Date().toISOString(),
    };

    const novosRegistros = [...registros, novoRegistro];
    setRegistros(novosRegistros);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novosRegistros));
    return novoRegistro;
  };

  const getRegistrosPorExercicio = (exercicio: string) => {
    return registros.filter((r) => r.exercicio === exercicio);
  };

  const getUltimoPeso = (exercicio: string): number | null => {
    const regs = getRegistrosPorExercicio(exercicio);
    if (regs.length === 0) return null;
    return regs[regs.length - 1].peso;
  };

  const getHistorico = (exercicio: string, limit = 6) => {
    return getRegistrosPorExercicio(exercicio).slice(-limit).reverse();
  };

  return {
    registros,
    salvarRegistro,
    getRegistrosPorExercicio,
    getUltimoPeso,
    getHistorico,
  };
}
