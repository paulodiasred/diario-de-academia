import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SeriesTrackerProps {
  seriesFeitas: boolean[];
  onConcluirSerie: (serie: number) => void;
  disabled: boolean;
}

export function SeriesTracker({ seriesFeitas, onConcluirSerie, disabled }: SeriesTrackerProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((serie) => {
        const feita = seriesFeitas[serie - 1];
        return (
          <motion.button
            key={serie}
            onClick={() => !feita && !disabled && onConcluirSerie(serie)}
            disabled={disabled || feita}
            whileTap={{ scale: 0.95 }}
            className={`relative p-4 rounded-2xl font-semibold transition-all ${
              feita
                ? "bg-gradient-to-br from-success to-success/80 text-success-foreground"
                : disabled
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
