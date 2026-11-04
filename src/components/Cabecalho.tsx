import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CabecalhoProps {
  titulo: string;
  subtitulo?: string;
  /** Tela interna: mostra o voltar e um título menor. As abas navegam pela barra inferior. */
  onVoltar?: () => void;
  children?: ReactNode;
}

/** O cabeçalho de todas as telas, menos o do treino, que tem controles próprios. */
export function Cabecalho({ titulo, subtitulo, onVoltar, children }: CabecalhoProps) {
  return (
    <header className="pt-4 flex items-center gap-2">
      {onVoltar && (
        <Button variant="ghost" size="icon" className="shrink-0 -ml-2" aria-label="Voltar" onClick={onVoltar}>
          <ArrowLeft />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className={`font-bold ${onVoltar ? "text-xl" : "text-2xl truncate"}`}>{titulo}</h1>
        {subtitulo && <p className="text-sm text-muted-foreground break-words">{subtitulo}</p>}
      </div>
      {children}
    </header>
  );
}
