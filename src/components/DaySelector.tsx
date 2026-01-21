import { motion } from "framer-motion";
import { dias } from "@/data/treino";

interface DaySelectorProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
}

export function DaySelector({ selectedDay, onDayChange }: DaySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {dias.map((dia) => (
        <motion.button
          key={dia}
          onClick={() => onDayChange(dia)}
          className={`relative px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-colors ${
            selectedDay === dia
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          whileTap={{ scale: 0.95 }}
        >
          {selectedDay === dia && (
            <motion.div
              layoutId="activeDay"
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary to-accent"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">{dia}</span>
        </motion.button>
      ))}
    </div>
  );
}
