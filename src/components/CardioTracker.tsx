interface CardioTrackerProps {
  concluido: boolean;
  onToggle: () => void;
}

export function CardioTracker({ concluido, onToggle }: CardioTrackerProps) {
  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-2xl font-semibold transition-all ${
        concluido
          ? "bg-green-600 text-white"
          : "bg-secondary text-foreground"
      }`}
    >
      {concluido ? "Cardio concluído ✅" : "Marcar cardio como feito"}
    </button>
  );
}