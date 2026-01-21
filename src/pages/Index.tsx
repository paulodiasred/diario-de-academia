import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Flame, Calendar, ArrowLeft, ChevronRight } from "lucide-react";
import { treino, dias } from "@/data/treino";
import { useTreinoStorage } from "@/hooks/useTreinoStorage";
import { DaySelector } from "@/components/DaySelector";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseDetail } from "@/components/ExerciseDetail";
import type { Exercicio } from "@/data/treino";

const Index = () => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [exercicioSelecionado, setExercicioSelecionado] = useState<Exercicio | null>(null);
  
  const { salvarRegistro, getRegistrosPorExercicio, getUltimoPeso } = useTreinoStorage();

  const exerciciosDoDia = useMemo(() => {
    return selectedDay ? treino.filter((t) => t.dia === selectedDay) : [];
  }, [selectedDay]);

  const gruposUnicos = useMemo(() => {
    const grupos = [...new Set(exerciciosDoDia.map((e) => e.grupo))];
    return grupos;
  }, [exerciciosDoDia]);

  if (!selectedDay) {
    return (
      <>
        <div className="min-h-screen p-4 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="pt-4 pb-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                  <Dumbbell className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Diário de Academia</h1>
                  <p className="text-muted-foreground text-sm">Selecione o dia do treino</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {dias.map((dia, index) => {
                const numExercicios = treino.filter(t => t.dia === dia).length;
                return (
                  <motion.div
                    key={dia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedDay(dia)}
                    className="glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-xl">
                          📅
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {dia}
                          </h3>
                          <p className="text-sm text-muted-foreground">{numExercicios} exercícios</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
        <footer className="mt-8 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
          © 2026 Paulo Dias - Red. Todos os direitos reservados.
        </footer>
      </>
    );
  }

  if (exercicioSelecionado) {
    return (
      <>
        <div className="min-h-screen p-4 max-w-md mx-auto">
          <ExerciseDetail
            exercicio={exercicioSelecionado}
            registros={getRegistrosPorExercicio(exercicioSelecionado.exercicio)}
            ultimoPeso={getUltimoPeso(exercicioSelecionado.exercicio)}
            onVoltar={() => setExercicioSelecionado(null)}
            onSalvarRegistro={salvarRegistro}
          />
        </div>
        <footer className="mt-2 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
          © 2026 Iron Buddy. Todos os direitos reservados.
        </footer>
      </>
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
              <button onClick={() => setSelectedDay(null)} className="p-2 rounded-lg hover:bg-secondary/50">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Treino de {selectedDay}</h1>
                <p className="text-muted-foreground text-sm flex items-center gap-1">
                  <Flame className="w-4 h-4 text-warning" />
                  {exerciciosDoDia.length} exercícios hoje
                </p>
              </div>
            </div>
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
      <footer className="mt-8 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
        © 2026 Iron Buddy. Todos os direitos reservados.
      </footer>
    </>
  );
};

export default Index;
