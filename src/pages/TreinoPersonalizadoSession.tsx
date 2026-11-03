import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dumbbell, Flame } from "lucide-react";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { useTreinoStorage } from "@/hooks/useTreinoStorage";
import { chaveDiaLocal } from "@/domain/datas";
import { exercicioConcluidoHoje } from "@/domain/registros";
import { ErrorState } from "@/components/ErrorState";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseDetail } from "@/components/ExerciseDetail";
import type { ExercicioInstanciado } from "@/data/treino";
import type { ExercicioNoTreino } from "@/types/catalogo";
import { MUSCULO_LABEL, CATEGORIA_LABEL } from "@/types/catalogo";

function toExercicioInstanciado(
  ex: ExercicioNoTreino,
  treinoId: string
): ExercicioInstanciado {
  const hoje = chaveDiaLocal();
  return {
    id: `${ex.exercicioId}-${treinoId}-${hoje}`,
    dia: `treino-${treinoId}`,
    grupo:
      MUSCULO_LABEL[ex.primaryMuscles[0]] ??
      ex.primaryMuscles[0] ??
      CATEGORIA_LABEL[ex.category] ??
      "Geral",
    exercicio: ex.exercicioNome,
    tipo: ex.category === "cardio" ? "Cardio" : "Força",
    descanso: ex.descanso,
    series: ex.series,
    images: ex.images,
  };
}

const TreinoPersonalizadoSession = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { treinos, loading, erro, recarregar } = useMeusTreinos();
  const {
    salvarRegistro,
    removerRegistro,
    getRegistrosPorExercicio,
    getUltimoPeso,
    registros,
    erro: erroRegistros,
    recarregar: recarregarRegistros,
  } = useTreinoStorage();

  const [exercicioSelecionado, setExercicioSelecionado] =
    useState<ExercicioInstanciado | null>(null);

  const treino = useMemo(
    () => treinos.find((t) => t.id === id),
    [treinos, id]
  );

  const exerciciosInstanciados = useMemo<ExercicioInstanciado[]>(() => {
    if (!treino || !id) return [];
    return treino.exercicios
      .slice()
      .sort((a, b) => a.ordem - b.ordem)
      .map((ex) => toExercicioInstanciado(ex, id));
  }, [treino, id]);

  if (erro || erroRegistros) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar este treino"
        onTentarNovamente={() => {
          void recarregar();
          void recarregarRegistros();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!treino) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Treino não encontrado</p>
          <button
            onClick={() => navigate("/meus-treinos")}
            className="text-primary underline"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (exercicioSelecionado) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <ExerciseDetail
          exercicio={exercicioSelecionado}
          registros={getRegistrosPorExercicio(exercicioSelecionado.exercicio)}
          ultimoPeso={getUltimoPeso(exercicioSelecionado.exercicio)}
          onVoltar={() => setExercicioSelecionado(null)}
          onSalvarRegistro={salvarRegistro}
          onRemoverRegistro={removerRegistro}
        />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate("/meus-treinos")}
                className="p-2 rounded-lg hover:bg-secondary/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight">
                  {treino.nome}
                </h1>
                {treino.descricao && (
                  <p className="text-muted-foreground text-xs truncate max-w-[200px]">
                    {treino.descricao}
                  </p>
                )}
                <p className="text-muted-foreground text-sm flex items-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 text-warning" />
                  {exerciciosInstanciados.length} exercício
                  {exerciciosInstanciados.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Lista de exercícios */}
          <AnimatePresence mode="wait">
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {exerciciosInstanciados.map((exercicio, index) => (
                <ExerciseCard
                  key={exercicio.id}
                  exercicio={exercicio}
                  index={index}
                  ultimoPeso={getUltimoPeso(exercicio.exercicio)}
                  onClick={() => setExercicioSelecionado(exercicio)}
                  isConcluido={exercicioConcluidoHoje(
                    registros,
                    { exercicio: exercicio.exercicio, dia: exercicio.dia },
                    exercicio.series ?? 1
                  )}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
      <footer className="mt-8 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
        © 2026 Diário de Academia. Todos os direitos reservados.
      </footer>
    </>
  );
};

export default TreinoPersonalizadoSession;
