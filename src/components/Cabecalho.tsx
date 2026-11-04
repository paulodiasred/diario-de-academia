import type { ReactNode } from "react";

interface CabecalhoProps {
  titulo: string;
  subtitulo?: string;
  children?: ReactNode;
}

/** Cabeçalho único das abas principais. A navegação fica na barra inferior. */
export function Cabecalho({ titulo, subtitulo, children }: CabecalhoProps) {
  return (
    <header className="pt-4 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold truncate">{titulo}</h1>
        {subtitulo && <p className="text-sm text-muted-foreground first-letter:uppercase">{subtitulo}</p>}
      </div>
      {children}
    </header>
  );
}
