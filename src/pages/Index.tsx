import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Flame, Calendar } from "lucide-react";
import { treino } from "@/data/treino";
import { useTreinoStorage } from "@/hooks/useTreinoStorage";
import { DaySelector } from "@/components/DaySelector";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseDetail } from "@/components/ExerciseDetail";
import type { Exercicio } from "@/data/treino";

const Index = () => {
  const [selectedDay, setSelectedDay] = useState("Segunda");
  const [exercicioSelecionado, setExercicioSelecionado] = useState<Exercicio | null>(null);
  
  const { salvarRegistro, getRegistrosPorExercicio, getUltimoPeso } = useTreinoStorage();

  const exerciciosDoDia = useMemo(() => {
    return treino.filter((t) => t.dia === selectedDay);
  }, [selectedDay]);

  const gruposUnicos = useMemo(() => {
    const grupos = [...new Set(exerciciosDoDia.map((e) => e.grupo))];
    return grupos;
  }, [exerciciosDoDia]);

  if (exercicioSelecionado) {
    return (
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <ExerciseDetail
          exercicio={exercicioSelecionado}
          registros={getRegistrosPorExercicio(exercicioSelecionado.exercicio)}
          ultimoPeso={getUltimoPeso(exercicioSelecionado.exercicio)}
          onVoltar={() => setExercicioSelecionado(null)}
          onSalvarRegistro={salvarRegistro}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="pt-4 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
              <Dumbbell className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Treino da Semana</h1>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Flame className="w-4 h-4 text-warning" />
                {exerciciosDoDia.length} exercícios hoje
              </p>
            </div>
          </div>
        </div>

        {/* Day Selector */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Dia do treino</span>
          </div>
          <DaySelector selectedDay={selectedDay} onDayChange={setSelectedDay} />
        </div>

        {/* Exercise List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {gruposUnicos.map((grupo) => (
              <div key={grupo}>
                <h2 className="text-lg font-semibold mb-3 gradient-text">{grupo}</h2>
                <div className="space-y-3">
                  {exerciciosDoDia
                    .filter((e) => e.grupo === grupo)
                    .map((exercicio, index) => (
                      <ExerciseCard
                        key={exercicio.exercicio}
                        exercicio={exercicio}
                        index={index}
                        ultimoPeso={getUltimoPeso(exercicio.exercicio)}
                        onClick={() => setExercicioSelecionado(exercicio)}
                      />
                    ))}
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Index;
