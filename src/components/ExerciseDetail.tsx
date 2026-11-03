import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  History,
  Check,
} from "lucide-react";
import {
  ExercicioInstanciado,
  grupoIcons,
  TreinoRegistro,
} from "@/data/treino";
import {
  historicoPorDia,
  localizarRegistroParaDesmarcar,
  seriesFeitasHoje,
} from "@/domain/registros";
import type { RegistroInput } from "@/domain/schemas";
import { useRestTimer } from "@/hooks/useRestTimer";
import { getExerciseImageUrl } from "@/lib/utils";
import { SeriesTracker } from "./SeriesTracker";
import { CardioTracker } from "./CardioTracker";
import { CircularTimer } from "./CircularTimer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Recharts é pesado: só carrega ao abrir um exercício.
const ProgressChart = lazy(() =>
  import("./ProgressChart").then((m) => ({ default: m.ProgressChart })),
);

interface ExerciseDetailProps {
  exercicio: ExercicioInstanciado;
  /** Todos os registros deste exercício, de qualquer treino. */
  registros: TreinoRegistro[];
  ultimoPeso: number | null;
  onVoltar: () => void;
  onSalvarRegistro: (registro: RegistroInput) => Promise<TreinoRegistro>;
  onRemoverRegistro: (registro: TreinoRegistro) => Promise<void>;
}

export function ExerciseDetail({
  exercicio,
  registros,
  ultimoPeso,
  onVoltar,
  onSalvarRegistro,
  onRemoverRegistro,
}: ExerciseDetailProps) {
  const [peso, setPeso] = useState(ultimoPeso?.toString() || "");
  const ehCardio = exercicio.tipo === "Cardio";
  const totalSeries = exercicio.series ?? 1;
  const descanso = exercicio.descanso ?? 0;
  const icon = grupoIcons[exercicio.grupo] || "🏋️";

  const alvo = useMemo(
    () => ({ exercicio: exercicio.exercicio, dia: exercicio.dia }),
    [exercicio.exercicio, exercicio.dia],
  );

  const feitasHoje = useMemo(() => seriesFeitasHoje(registros, alvo), [registros, alvo]);
  const seriesFeitas = useMemo(
    () =>
      ehCardio
        ? []
        : Array.from({ length: totalSeries }, (_, i) => feitasHoje.has(i + 1)),
    [ehCardio, totalSeries, feitasHoje],
  );
  const concluido = ehCardio ? feitasHoje.size > 0 : seriesFeitas.every(Boolean);

  const historico = useMemo(() => historicoPorDia(registros), [registros]);

  const timer = useRestTimer(descanso, () => toast.success("Descanso finalizado! 💪"));

  // Volta para a lista só quando o exercício ACABOU de ser concluído. Quem reabre um
  // exercício já concluído continua na tela e pode corrigir uma série.
  const concluidoAntes = useRef(concluido);
  const onVoltarRef = useRef(onVoltar);
  onVoltarRef.current = onVoltar;
  useEffect(() => {
    const acabouDeConcluir = concluido && !concluidoAntes.current;
    concluidoAntes.current = concluido;
    if (!acabouDeConcluir) return;
    toast.success(ehCardio ? "Cardio concluído! ❤️‍🔥" : "Exercício concluído! 🎉");
    const espera = setTimeout(() => onVoltarRef.current(), 800);
    return () => clearTimeout(espera);
  }, [concluido, ehCardio]);

  const concluirSerie = async (serie: number, desmarcar = false) => {
    if (desmarcar) {
      const registro = localizarRegistroParaDesmarcar(registros, alvo, serie);
      if (registro) {
        await onRemoverRegistro(registro);
        toast.success(`Série ${serie} desmarcada!`);
      }
      return;
    }

    const pesoNum = parseFloat(peso);
    if (!pesoNum || pesoNum <= 0) {
      toast.error("Digite um peso válido");
      return;
    }

    try {
      await onSalvarRegistro({ ...alvo, peso: pesoNum, serie, concluida: true });
      toast.success(`Série ${serie} concluída!`);
      if (descanso > 0) timer.iniciar();
    } catch (error) {
      console.error("Erro ao salvar série:", error);
      toast.error("Confira os valores da série e tente de novo");
    }
  };

  const concluirCardio = async () => {
    if (concluido) return;
    try {
      await onSalvarRegistro({ ...alvo, peso: 0, serie: 0, concluida: true });
    } catch (error) {
      console.error("Erro ao salvar cardio:", error);
      toast.error("Não foi possível salvar o cardio");
    }
  };

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
          aria-label="Voltar"
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

      {/* Imagens do exercício */}
      {exercicio.images && exercicio.images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {exercicio.images.map((img, i) => (
            <img
              key={i}
              src={getExerciseImageUrl(img)}
              alt={`${exercicio.exercicio} passo ${i + 1}`}
              className="h-36 w-auto rounded-2xl object-cover shrink-0 bg-secondary/40"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          ))}
        </div>
      )}

      {exercicio.tipo === "Circuito" && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold mb-2">Circuito</h3>

          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {exercicio.circuito?.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-xs text-muted-foreground mt-2">
            Executar os exercícios em sequência, sem descanso entre eles.
          </p>

          <p className="text-xs text-muted-foreground mt-2">
            Utilizar 50% da carga dos exercícios de força para o circuito.
          </p>
        </div>
      )}

      {/* Timer */}
      {!ehCardio && descanso > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <CircularTimer
            tempoRestante={timer.restante}
            tempoTotal={descanso}
            isActive={timer.ativo}
          />
          <div className="flex justify-center gap-3 mt-4">
            {timer.ativo ? (
              <Button onClick={timer.pausar} variant="secondary">
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            ) : (
              <Button
                onClick={timer.pausado ? timer.retomar : timer.iniciar}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                <Play className="w-4 h-4 mr-2" />
                {timer.pausado ? "Retomar" : "Iniciar Descanso"}
              </Button>
            )}
            <Button
              onClick={timer.resetar}
              variant="outline"
              size="icon"
              aria-label="Reiniciar descanso"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Peso Input */}
      {!ehCardio && (
        <div className="glass-card rounded-2xl p-4">
          <label
            htmlFor="peso-atual"
            className="text-sm text-muted-foreground mb-2 block"
          >
            Peso atual (kg)
          </label>
          <div className="flex gap-3">
            <Input
              id="peso-atual"
              type="number"
              inputMode="decimal"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              placeholder="Ex: 50"
              className="text-lg font-semibold bg-secondary/30 border-secondary"
            />
            {ultimoPeso !== null && (
              <div className="flex items-center gap-2 px-4 bg-secondary/30 rounded-xl">
                <span className="text-muted-foreground text-sm">Último:</span>
                <span className="font-bold text-primary">{ultimoPeso}kg</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Series */}
      {!ehCardio && (
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
      )}

      {ehCardio && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold mb-4">Cardio</h3>
          <CardioTracker concluido={concluido} onToggle={concluirCardio} />
        </div>
      )}

      {/* Histórico */}
      {!ehCardio && (
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
                        Média -{" "}
                        <span className="text-primary">
                          {item.media.toFixed(1)}kg
                        </span>{" "}
                        ({item.series} séries)
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
      )}

      {/* Gráfico */}
      {!ehCardio && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Evolução
          </h3>
          <Suspense fallback={<div className="h-48" />}>
            <ProgressChart registros={registros} />
          </Suspense>
        </div>
      )}
    </motion.div>
  );
}
