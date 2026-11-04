import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { getExerciseImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ImagemExercicioProps {
  caminho?: string | null;
  alt: string;
  className?: string;
}

/**
 * Enquadramento único para todas as fotos. No tema escuro elas ficam um pouco menos
 * brilhantes, porque muitas têm fundo branco. Sem foto, mostra um ícone em vez de um buraco.
 */
export function ImagemExercicio({ caminho, alt, className }: ImagemExercicioProps) {
  const [falhou, setFalhou] = useState(false);

  if (!caminho || falhou) {
    return (
      <div
        aria-hidden
        className={cn("rounded-lg bg-secondary flex items-center justify-center text-muted-foreground", className)}
      >
        <Dumbbell className="w-1/3 h-1/3" />
      </div>
    );
  }

  return (
    <img
      src={getExerciseImageUrl(caminho)}
      alt={alt}
      loading="lazy"
      onError={() => setFalhou(true)}
      className={cn("rounded-lg object-cover bg-secondary dark:brightness-90", className)}
    />
  );
}
