import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto no formato da tela, para o conteúdo não pular ao carregar. */
export function TelaCarregando() {
  return (
    <div
      role="status"
      aria-label="Carregando"
      className="min-h-screen p-4 max-w-md mx-auto space-y-4 pt-8"
    >
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-xl" />
    </div>
  );
}

interface EstadoVazioProps {
  titulo: string;
  descricao: string;
  children?: ReactNode;
}

export function EstadoVazio({ titulo, descricao, children }: EstadoVazioProps) {
  return (
    <section className="glass-card rounded-xl p-6 text-center space-y-3">
      <h2 className="font-semibold">{titulo}</h2>
      <p className="text-sm text-muted-foreground">{descricao}</p>
      {children}
    </section>
  );
}
