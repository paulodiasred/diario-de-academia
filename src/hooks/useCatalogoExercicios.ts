import { useMemo, useState } from "react";
import catalogoData from "@/exercises/exercises-ptbr-partial-translation.json";
import type { ExercicioCatalogo } from "@/types/catalogo";

const catalogo = catalogoData as ExercicioCatalogo[];

export interface FiltrosCatalogo {
  busca: string;
  categoria: string;
  musculo: string;
  nivel: string;
  equipamento: string;
}

export function useCatalogoExercicios() {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({
    busca: "",
    categoria: "",
    musculo: "",
    nivel: "",
    equipamento: "",
  });

  const exerciciosFiltrados = useMemo(() => {
    return catalogo.filter((ex) => {
      if (
        filtros.busca &&
        !ex.name.toLowerCase().includes(filtros.busca.toLowerCase())
      ) {
        return false;
      }
      if (filtros.categoria && ex.category !== filtros.categoria) return false;
      if (
        filtros.musculo &&
        !ex.primaryMuscles.includes(filtros.musculo)
      )
        return false;
      if (filtros.nivel && ex.level !== filtros.nivel) return false;
      if (filtros.equipamento && ex.equipment !== filtros.equipamento)
        return false;
      return true;
    });
  }, [filtros]);

  const categorias = useMemo(
    () =>
      [...new Set(catalogo.map((e) => e.category).filter(Boolean))].sort(),
    []
  );

  const musculos = useMemo(
    () =>
      [...new Set(catalogo.flatMap((e) => e.primaryMuscles))].sort(),
    []
  );

  const niveis = ["beginner", "intermediate", "expert"];

  const equipamentos = useMemo(
    () =>
      [
        ...new Set(
          catalogo.map((e) => e.equipment).filter((e): e is string => !!e)
        ),
      ].sort(),
    []
  );

  const limparFiltros = () => {
    setFiltros({ busca: "", categoria: "", musculo: "", nivel: "", equipamento: "" });
  };

  return {
    exerciciosFiltrados,
    filtros,
    setFiltros,
    categorias,
    musculos,
    niveis,
    equipamentos,
    limparFiltros,
    total: exerciciosFiltrados.length,
  };
}
