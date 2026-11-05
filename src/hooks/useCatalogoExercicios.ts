import { useMemo, useState } from "react";
import { buscarExercicios, pertenceAoGrupo } from "@/domain/catalogo";
import { catalogo } from "@/data/catalogo";
import type { ExercicioCatalogo } from "@/types/catalogo";
import { useExerciciosProprios } from "./useExerciciosProprios";

export { catalogo };

export interface FiltrosCatalogo {
  busca: string;
  grupo: string;
  categoria: string;
  musculo: string;
  nivel: string;
  equipamento: string;
}

const SEM_FILTROS: FiltrosCatalogo = {
  busca: "",
  grupo: "",
  categoria: "",
  musculo: "",
  nivel: "",
  equipamento: "",
};

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
  const { exercicios: proprios, erro: erroProprios, recarregar: recarregarProprios } = useExerciciosProprios();
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(SEM_FILTROS);

  const todos = useMemo(() => [...proprios, ...catalogo], [proprios]);

  const exerciciosFiltrados = useMemo(() => {
    const filtrados = todos.filter((ex) => {
      if (filtros.grupo && !pertenceAoGrupo(ex, filtros.grupo)) return false;
      if (filtros.categoria && ex.category !== filtros.categoria) return false;
      if (filtros.musculo && !ex.primaryMuscles.includes(filtros.musculo)) return false;
      if (filtros.nivel && ex.level !== filtros.nivel) return false;
      if (filtros.equipamento && ex.equipment !== filtros.equipamento) return false;
      return true;
    });
    return buscarExercicios(filtrados, filtros.busca);
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

  const limparFiltros = () => setFiltros(SEM_FILTROS);

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
    erroProprios,
    recarregarProprios,
    total: exerciciosFiltrados.length,
  };
}
