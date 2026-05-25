import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Flame,
  Calendar,
  ArrowLeft,
  ChevronRight,
  LogOut,
  ListChecks,
} from "lucide-react";
import { treino, dias, grupoIcons } from "@/data/treino";
import { useTreinoStorage } from "@/hooks/useTreinoStorage";
import { useAuth } from "@/hooks/useAuth";
import { DaySelector } from "@/components/DaySelector";
import { ExerciseCard } from "@/components/ExerciseCard";
import { ExerciseDetail } from "@/components/ExerciseDetail";
import { Button } from "@/components/ui/button";
import type { Exercicio } from "@/data/treino";
import { gerarTreinoComId, ExercicioInstanciado } from "@/data/treino";

const Index = () => {
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [exercicioSelecionado, setExercicioSelecionado] =
    useState<ExercicioInstanciado | null>(null);

  const {
    salvarRegistro,
    getRegistrosPorExercicio,
    getUltimoPeso,
    loading,
    reloadRegistros,
    registros,
  } = useTreinoStorage();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const exerciciosDoDia = useMemo<ExercicioInstanciado[]>(() => {
    if (!selectedDay) return [];
    return gerarTreinoComId(selectedDay);
  }, [selectedDay]);

  const gruposUnicos = useMemo(() => {
    const grupos = [...new Set(exerciciosDoDia.map((e) => e.grupo))];
    return grupos;
  }, [exerciciosDoDia]);

  // Verifica se um exercício foi totalmente concluído hoje
  const isExercicioConcluidoHoje = (
    exercicioId: string,
    totalSeries: number,
  ) => {
    const hoje = new Date().toDateString();

    const registrosHoje = registros.filter(
      (r) =>
        new Date(r.data).toDateString() === hoje &&
        r.exercicioId === exercicioId &&
        r.userId === user?.uid,
    );

    const seriesConcluidas = new Set(registrosHoje.map((r) => r.serie)).size;
    return seriesConcluidas >= totalSeries;
  };

  const dayNameMap: Record<number, string> = {
    1: "Segunda",
    2: "Terça",
    3: "Quarta",
    4: "Quinta",
    5: "Sexta",
  };
  const todayName = dayNameMap[new Date().getDay()] ?? null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName =
    user?.displayName?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "atleta";

  const diaIcone = (dia: string) => {
    const firstExercise = treino.find((e) => e.dia === dia);
    return firstExercise ? (grupoIcons[firstExercise.grupo] ?? "📅") : "📅";
  };

  const getDayProgress = (dia: string) => {
    const exerciciosDia = treino.filter((e) => e.dia === dia);
    const total = exerciciosDia.length;
    const hoje = new Date().toISOString().split("T")[0];
    const concluidos = exerciciosDia.filter((e) => {
      const id = `${e.exercicio}-${dia}-${hoje}`;
      const series = "series" in e ? e.series : 1;
      return isExercicioConcluidoHoje(id, series);
    }).length;
    return { total, concluidos };
  };

  if (!selectedDay) {
    if (loading) {
      return (
        <div className="min-h-screen p-4 max-w-md mx-auto flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="p-4 pb-24 max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary text-xl font-bold text-primary-foreground">
                    {firstName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">
                      {greeting}, {firstName}!
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      Selecione o dia do treino
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="rounded-xl"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {/* Botão Meus Treinos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate("/meus-treinos")}
                className="glass-card rounded-2xl p-4 cursor-pointer hover:border-primary/40 transition-all group border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl">
                      <ListChecks className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary group-hover:text-primary transition-colors">
                        Meus Treinos
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Crie e gerencie seus treinos
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                </div>
              </motion.div>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">Treino da semana</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {dias.map((dia, index) => {
                const isToday = dia === todayName;
                const { total, concluidos } = getDayProgress(dia);
                const isComplete = total > 0 && concluidos >= total;
                const icon = diaIcone(dia);
                return (
                  <motion.div
                    key={dia}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedDay(dia)}
                    className={`glass-card rounded-2xl p-4 cursor-pointer transition-all group ${
                      isToday
                        ? "border-primary/60"
                        : "hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                            isComplete
                              ? "bg-success/20"
                              : isToday
                              ? "bg-primary/20"
                              : "bg-secondary/50"
                          }`}
                        >
                          {isComplete ? "✅" : icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className={`font-semibold transition-colors ${
                                isToday
                                  ? "text-primary"
                                  : "text-foreground group-hover:text-primary"
                              }`}
                            >
                              {dia}
                            </h3>
                            {isToday && (
                              <span className="text-xs font-medium px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                                Hoje
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {concluidos > 0
                              ? `${concluidos}/${total} concluídos`
                              : `${total} exercícios`}
                          </p>
                          {concluidos > 0 && (
                            <div className="mt-1.5 h-1 w-28 bg-secondary/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isComplete ? "bg-success" : "bg-primary"
                                }`}
                                style={{
                                  width: `${(concluidos / total) * 100}%`,
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 transition-colors ${
                          isToday
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
        <footer className="mt-8 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
          © 2026 Iron Buddy. Todos os direitos reservados.
        </footer>
      </>
    );
  }

  if (exercicioSelecionado) {
    return (
      <>
        <div className="min-h-screen p-4 pb-8 max-w-md mx-auto">
          <ExerciseDetail
            exercicio={exercicioSelecionado}
            registros={getRegistrosPorExercicio(exercicioSelecionado.exercicio)}
            ultimoPeso={getUltimoPeso(exercicioSelecionado.exercicio)}
            onVoltar={() => setExercicioSelecionado(null)}
            onSalvarRegistro={salvarRegistro}
            reloadRegistros={reloadRegistros}
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
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-lg hover:bg-secondary/50"
              >
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
                  <h2 className="text-lg font-semibold mb-3 gradient-text">
                    {grupo}
                  </h2>
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
                          isConcluido={isExercicioConcluidoHoje(
                            exercicio.exercicio,
                            "series" in exercicio ? exercicio.series : 1,
                          )}
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
