import * as React from "react";
import { cn } from "@/lib/utils";

/** O seletor único do app. Nativo: no celular, abre a lista do próprio sistema. */
export const CampoSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-11 w-full rounded-md border border-input bg-surface-2 px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
CampoSelect.displayName = "CampoSelect";
