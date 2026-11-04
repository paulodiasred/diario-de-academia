import { useEffect, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { avisarFimDoDescanso } from "@/lib/avisoDescanso";
import {
  ajustarDescanso,
  pausarDescanso,
  retomarDescanso,
  segundosRestantes,
  type Descanso,
} from "@/domain/sessao";

interface DescansoBarProps {
  descanso: Descanso;
  onMudar: (descanso: Descanso | null) => void;
}

const formatar = (segundos: number) =>
  `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;

export function DescansoBar({ descanso, onMudar }: DescansoBarProps) {
  const [, setTique] = useState(0);
  const rodando = descanso.fimEm !== null;

  useEffect(() => {
    if (!rodando) return;
    const tick = () => setTique((t) => t + 1);
    const intervalo = setInterval(tick, 500);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [rodando]);

  const restante = segundosRestantes(descanso);
  const progresso = descanso.duracaoSeg > 0 ? (restante / descanso.duracaoSeg) * 100 : 0;

  const avisou = useRef(false);
  useEffect(() => {
    if (!rodando || restante > 0 || avisou.current) return;
    avisou.current = true;
    toast.success("Descanso finalizado! 💪");
    navigator.vibrate?.(300);
    void avisarFimDoDescanso();
    onMudar(null);
  }, [rodando, restante, onMudar]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-3 pb-3 pointer-events-none">
      <section
        aria-label="Descanso"
        className="glass-card pointer-events-auto w-full max-w-md rounded-xl overflow-hidden"
      >
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
        </div>
        <div className="flex items-center gap-2 p-2">
          <div className="flex-1 min-w-0 pl-2">
            <p className="text-[13px] text-muted-foreground">{rodando ? "Descanso" : "Pausado"}</p>
            <p role="timer" className="text-2xl font-bold tabular-nums leading-tight">
              {formatar(restante)}
            </p>
          </div>
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11"
            aria-label="Menos 15 segundos"
            onClick={() => onMudar(ajustarDescanso(descanso, -15))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11"
            aria-label="Mais 15 segundos"
            onClick={() => onMudar(ajustarDescanso(descanso, 15))}
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11"
            aria-label={rodando ? "Pausar descanso" : "Retomar descanso"}
            onClick={() => onMudar(rodando ? pausarDescanso(descanso) : retomarDescanso(descanso))}
          >
            {rodando ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-11 w-11"
            aria-label="Pular descanso"
            onClick={() => onMudar(null)}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
