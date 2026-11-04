import { Minus, Pause, Play, Plus, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ajustarDescanso, pausarDescanso, retomarDescanso, type Descanso } from "@/domain/sessao";
import { formatarTempo } from "@/domain/texto";
import { useTempoDescanso } from "@/hooks/useTempoDescanso";

interface DescansoBarProps {
  descanso: Descanso;
  onMudar: (descanso: Descanso | null) => void;
}

/** O som e a vibração ficam em AvisoFimDescanso, que também funciona fora desta tela. */
export function DescansoBar({ descanso, onMudar }: DescansoBarProps) {
  const { rodando, terminou, restante, excedido } = useTempoDescanso(descanso);
  const progresso = descanso.duracaoSeg > 0 ? (restante / descanso.duracaoSeg) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center px-3 pb-3 pointer-events-none">
      {terminou ? (
        // Fica até a próxima série ou até ser dispensado: um aviso que some passa despercebido.
        <section
          aria-label="Descanso"
          className="pointer-events-auto w-full max-w-md rounded-xl bg-primary text-primary-foreground shadow-lg"
        >
          <div className="flex items-center gap-2 p-2">
            <div className="flex-1 min-w-0 pl-2" role="status">
              <p className="font-bold leading-tight">Hora da próxima série</p>
              <p role="timer" className="text-sm tabular-nums">
                O descanso acabou há {formatarTempo(excedido)}
              </p>
            </div>
            <Button
              variant="secondary"
              className="h-11 px-3"
              aria-label="Mais 15 segundos"
              onClick={() => onMudar(ajustarDescanso({ ...descanso, fimEm: Date.now() }, 15))}
            >
              +15s
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="h-11 w-11"
              aria-label="Dispensar aviso"
              onClick={() => onMudar(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </section>
      ) : (
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
                {formatarTempo(restante)}
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
      )}
    </div>
  );
}
