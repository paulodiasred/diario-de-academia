import { motion } from "framer-motion";

interface CircularTimerProps {
  tempoRestante: number;
  tempoTotal: number;
  isActive: boolean;
}

export function CircularTimer({ tempoRestante, tempoTotal, isActive }: CircularTimerProps) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = tempoTotal > 0 ? (tempoRestante / tempoTotal) * circumference : 0;

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#timerGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          initial={false}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 0.3 }}
        />
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={tempoRestante}
          initial={{ scale: 1.2, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold gradient-text"
        >
          {tempoRestante}
        </motion.span>
        <span className="text-muted-foreground text-sm mt-1">segundos</span>
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ boxShadow: ["0 0 20px hsl(var(--primary) / 0.3)", "0 0 40px hsl(var(--primary) / 0.5)", "0 0 20px hsl(var(--primary) / 0.3)"] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
    </div>
  );
}
