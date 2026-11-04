import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `destaque`: o que define o item, como o dia do treino. `neutro`: informação de apoio. */
  variante?: "destaque" | "neutro";
}

/** Só informa. O texto usa a cor principal do tema: limão sobre limão não tem contraste no tema claro. */
export function Chip({ variante = "neutro", className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-caption text-foreground",
        variante === "destaque" ? "bg-primary/15 font-semibold" : "bg-surface-3 text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

interface ChipFiltroProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> {
  ativo: boolean;
}

export function ChipFiltro({ ativo, className, ...props }: ChipFiltroProps) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={cn(
        "h-9 shrink-0 rounded-lg px-3 text-caption font-medium border",
        ativo
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface-2 text-foreground border-transparent",
        className,
      )}
      {...props}
    />
  );
}
