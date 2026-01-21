import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, Pause, RotateCcw, TrendingUp, History, Check } from "lucide-react";
import { Exercicio, grupoIcons, TreinoRegistro } from "@/data/treino";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SeriesTracker } from "./SeriesTracker";
import { ProgressChart } from "./ProgressChart";
import { CircularTimer } from "./CircularTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ExerciseDetailProps {
  exercicio: Exercicio;
  registros: TreinoRegistro[];
  ultimoPeso: number | null;
  onVoltar: () => void;
  onSalvarRegistro: (registro: { exercicio: string; peso: number; serie: number; dia: string; concluida?: boolean }) => Promise<TreinoRegistro>;
  reloadRegistros: () => Promise<void>;
}

export function ExerciseDetail({
  exercicio,
  registros,
  ultimoPeso,
  onVoltar,
  onSalvarRegistro,
  reloadRegistros,
}: ExerciseDetailProps) {
  const [peso, setPeso] = useState(ultimoPeso?.toString() || "");
  const [seriesFeitas, setSeriesFeitas] = useState([false, false, false, false]);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);

  const icon = grupoIcons[exercicio.grupo] || "🏋️";

  const iniciarDescanso = useCallback(() => {
    setTempoRestante(exercicio.descanso);
    setTimerAtivo(true);
  }, [exercicio.descanso]);

  const pausarTimer = () => {
    setTimerAtivo(false);
  };

  const resetarTimer = () => {
    setTempoRestante(exercicio.descanso);
    setTimerAtivo(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerAtivo && tempoRestante > 0) {
      interval = setInterval(() => {
        setTempoRestante((t) => {
          if (t <= 1) {
            setTimerAtivo(false);
            toast.success("Descanso finalizado! 💪");
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerAtivo, tempoRestante]);

  // Inicializar séries baseadas em registros existentes
  useEffect(() => {
    const hoje = new Date();
    const hojeStr = hoje.getFullYear() + '-' + (hoje.getMonth() + 1) + '-' + hoje.getDate();
    const registrosHoje = registros.filter(r => {
      const dataRegistro = new Date(r.data);
      const dataStr = dataRegistro.getFullYear() + '-' + (dataRegistro.getMonth() + 1) + '-' + dataRegistro.getDate();
      return dataStr === hojeStr && r.concluida;
    });
    const novasSeries = [false, false, false, false];
    registrosHoje.forEach(r => {
      if (r.serie >= 1 && r.serie <= 4) {
        novasSeries[r.serie - 1] = true;
      }
    });
    setSeriesFeitas(novasSeries);
  }, [registros]);

  const concluirSerie = async (serie: number, desmarcar = false) => {
    if (desmarcar) {
      // Encontrar e remover o registro da série
      const registrosDaSerie = registros.filter(r => r.serie === serie && r.concluida);
      if (registrosDaSerie.length > 0) {
        // Remover o mais recente
        const registroMaisRecente = registrosDaSerie.sort((a, b) => 
          new Date(b.data).getTime() - new Date(a.data).getTime()
        )[0];
        
        try {
          await deleteDoc(doc(db, "registros", registroMaisRecente.id!));
          const novasSeries = [...seriesFeitas];
          novasSeries[serie - 1] = false;
          setSeriesFeitas(novasSeries);
          await reloadRegistros();
          toast.success(`Série ${serie} desmarcada!`);
        } catch (error) {
          console.error("Erro ao desmarcar série:", error);
          toast.error("Erro ao desmarcar série");
        }
      }
      return;
    }

    const pesoNum = parseFloat(peso);
    if (!pesoNum || pesoNum <= 0) {
      toast.error("Digite um peso válido");
      return;
    }

    try {
      await onSalvarRegistro({
        exercicio: exercicio.exercicio,
        peso: pesoNum,
        serie,
        dia: exercicio.dia,
        concluida: true,
      });

      const novasSeries = [...seriesFeitas];
      novasSeries[serie - 1] = true;
      setSeriesFeitas(novasSeries);

      toast.success(`Série ${serie} concluída!`);

      if (exercicio.descanso > 0) {
        iniciarDescanso();
      }
    } catch (error) {
      console.error("Erro ao salvar série:", error);
      toast.error("Erro ao salvar série");
    }
  };

  const historico = useMemo(() => {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filtrar registros dos últimos 7 dias e concluídos
    const registrosFiltrados = registros.filter(r => 
      new Date(r.data) >= seteDiasAtras && r.concluida
    );
    
    // Agrupar por data e calcular média
    const agrupadoPorData = registrosFiltrados.reduce((acc, r) => {
      const dataStr = new Date(r.data).toLocaleDateString("pt-BR");
      if (!acc[dataStr]) {
        acc[dataStr] = { pesos: [], data: r.data };
      }
      acc[dataStr].pesos.push(r.peso);
      return acc;
    }, {} as Record<string, { pesos: number[], data: string }>);
    
    // Calcular médias e ordenar por data decrescente
    return Object.entries(agrupadoPorData)
      .map(([dataStr, { pesos, data }]) => ({
        data: data,
        dataStr,
        media: pesos.reduce((sum, p) => sum + p, 0) / pesos.length,
        series: pesos.length
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 5); // Últimos 5 dias
  }, [registros]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onVoltar}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{exercicio.exercicio}</h1>
          <p className="text-muted-foreground text-sm">{exercicio.grupo}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>

      {/* Timer */}
      {exercicio.descanso > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <CircularTimer
            tempoRestante={tempoRestante}
            tempoTotal={exercicio.descanso}
            isActive={timerAtivo}
          />
          <div className="flex justify-center gap-3 mt-4">
            {!timerAtivo ? (
              <Button
                onClick={iniciarDescanso}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Play className="w-4 h-4 mr-2" />
                Iniciar Descanso
              </Button>
            ) : (
              <Button onClick={pausarTimer} variant="secondary">
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            <Button onClick={resetarTimer} variant="outline" size="icon">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Peso Input */}
      <div className="glass-card rounded-2xl p-4">
        <label className="text-sm text-muted-foreground mb-2 block">
          Peso atual (kg)
        </label>
        <div className="flex gap-3">
          <Input
            type="number"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            placeholder="Ex: 50"
            className="text-lg font-semibold bg-secondary/30 border-secondary"
          />
          {ultimoPeso && (
            <div className="flex items-center gap-2 px-4 bg-secondary/30 rounded-xl">
              <span className="text-muted-foreground text-sm">Último:</span>
              <span className="font-bold text-primary">{ultimoPeso}kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Series */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Séries
        </h3>
        <SeriesTracker
          seriesFeitas={seriesFeitas}
          onConcluirSerie={concluirSerie}
          disabled={!peso || parseFloat(peso) <= 0}
        />
      </div>

      {/* Histórico */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Histórico
        </h3>
        <AnimatePresence>
          {historico.length > 0 ? (
            <div className="space-y-2">
              {historico.map((item, i) => (
                <motion.div
                  key={item.dataStr}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex justify-between items-center p-3 bg-success/20 border border-success/30 rounded-xl"
                >
                  <span className="text-muted-foreground text-sm">
                    {item.dataStr}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-success">
                      Média - <span className="text-primary">{item.media.toFixed(1)}kg</span> ({item.series} séries)
                    </span>
                    <Check className="w-4 h-4 text-success" />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhum registro ainda
            </p>
          )}
        </AnimatePresence>
      </div>

      {/* Gráfico */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Evolução
        </h3>
        <ProgressChart registros={registros} />
      </div>
    </motion.div>
  );
}
