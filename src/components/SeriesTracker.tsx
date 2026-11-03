import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SeriesTrackerProps {
  seriesFeitas: boolean[];
  onConcluirSerie: (serie: number, desmarcar?: boolean) => void;
  disabled: boolean;
}

export function SeriesTracker({ seriesFeitas, onConcluirSerie, disabled }: SeriesTrackerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {seriesFeitas.map((feita, index) => {
        const serie = index + 1;
        // Desmarcar não depende de haver peso digitado.
        const bloqueada = disabled && !feita;
        return (
          <motion.button
            key={serie}
            onClick={() => !bloqueada && onConcluirSerie(serie, feita)}
            disabled={bloqueada}
            aria-pressed={feita}
            whileTap={{ scale: 0.95 }}
            className={`relative p-4 rounded-2xl font-semibold transition-all ${
              feita
                ? "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                : bloqueada
                ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                : "glass-card hover:border-primary/50 text-foreground"
            }`}
          >
            <div className="text-center">
              <span className="text-xs text-muted-foreground block mb-1">Série</span>
              <span className="text-xl font-bold">{serie}</span>
              {feita && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
