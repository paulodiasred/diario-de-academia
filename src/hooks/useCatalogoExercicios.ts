import { useMemo, useState } from "react";
import catalogoData from "@/exercises/exercises-ptbr-partial-translation.json";
import { normalizarBusca } from "@/domain/texto";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { useExerciciosProprios } from "./useExerciciosProprios";

const catalogo = catalogoData as ExercicioCatalogo[];

export interface FiltrosCatalogo {
  busca: string;
  categoria: string;
  musculo: string;
  nivel: string;
  equipamento: string;
}

/** Mesmo músculo principal e equipamento. Não são variações oficiais, só parecidos. */
export function exerciciosSemelhantes(
  exercicio: ExercicioCatalogo,
  todos: ExercicioCatalogo[],
  limite = 5,
): ExercicioCatalogo[] {
  const principal = exercicio.primaryMuscles[0];
  return todos
    .filter(
      (e) =>
        e.id !== exercicio.id &&
        e.primaryMuscles[0] === principal &&
        e.equipment === exercicio.equipment,
    )
    .slice(0, limite);
}

export function useCatalogoExercicios() {
  const { exercicios: proprios } = useExerciciosProprios();
  const [filtros, setFiltros] = useState<FiltrosCatalogo>({
    busca: "",
    categoria: "",
    musculo: "",
    nivel: "",
    equipamento: "",
  });

  const todos = useMemo(() => [...proprios, ...catalogo], [proprios]);

  const exerciciosFiltrados = useMemo(() => {
    const busca = normalizarBusca(filtros.busca);
    return todos.filter((ex) => {
      if (busca && !normalizarBusca(ex.name).includes(busca)) return false;
      if (filtros.categoria && ex.category !== filtros.categoria) return false;
      if (filtros.musculo && !ex.primaryMuscles.includes(filtros.musculo)) return false;
      if (filtros.nivel && ex.level !== filtros.nivel) return false;
      if (filtros.equipamento && ex.equipment !== filtros.equipamento) return false;
      return true;
    });
  }, [filtros, todos]);

  const categorias = useMemo(
    () => [...new Set(catalogo.map((e) => e.category).filter(Boolean))].sort(),
    [],
  );

  const musculos = useMemo(() => [...new Set(catalogo.flatMap((e) => e.primaryMuscles))].sort(), []);

  const niveis = ["beginner", "intermediate", "expert"];

  const equipamentos = useMemo(
    () => [...new Set(catalogo.map((e) => e.equipment).filter((e): e is string => !!e))].sort(),
    [],
  );

  const limparFiltros = () => {
    setFiltros({ busca: "", categoria: "", musculo: "", nivel: "", equipamento: "" });
  };

  return {
    todos,
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
