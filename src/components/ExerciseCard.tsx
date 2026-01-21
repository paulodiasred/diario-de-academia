import { motion } from "framer-motion";
import { Clock, ChevronRight, CheckCircle } from "lucide-react";
import { Exercicio, grupoIcons } from "@/data/treino";

interface ExerciseCardProps {
  exercicio: Exercicio;
  index: number;
  ultimoPeso: number | null;
  onClick: () => void;
  isConcluido?: boolean;
}

export function ExerciseCard({ exercicio, index, ultimoPeso, onClick, isConcluido = false }: ExerciseCardProps) {
  const icon = grupoIcons[exercicio.grupo] || "🏋️";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={isConcluido ? undefined : onClick}
      className={`glass-card rounded-2xl p-4 transition-all group ${
        isConcluido 
          ? 'opacity-75 cursor-not-allowed bg-success/10 border-success/30' 
          : 'cursor-pointer hover:border-primary/30'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
            isConcluido ? 'bg-success/20' : 'bg-secondary/50'
          }`}>
            {isConcluido ? <CheckCircle className="w-6 h-6 text-success" /> : icon}
          </div>
          <div>
            <h3 className={`font-semibold transition-colors ${
              isConcluido 
                ? 'text-success' 
                : 'text-foreground group-hover:text-primary'
            }`}>
              {exercicio.exercicio}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/50 rounded-full">
                {exercicio.grupo}
              </span>
              {exercicio.descanso > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {exercicio.descanso}s
                </span>
              )}
              {isConcluido && (
                <span className="text-xs text-success px-2 py-0.5 bg-success/20 rounded-full font-medium">
                  Concluído hoje
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ultimoPeso && (
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{ultimoPeso}kg</p>
              <p className="text-xs text-muted-foreground">último</p>
            </div>
          )}
          {isConcluido ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
