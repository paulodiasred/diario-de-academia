import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface IndicadorProps {
  rotulo: string;
  valor: string;
  /** Variação em %, contra o período anterior. null: sem base de comparação. */
  variacao?: number | null;
  nota?: string;
}

export function Indicador({ rotulo, valor, variacao, nota }: IndicadorProps) {
  return (
    <div className="glass-card rounded-xl p-4 min-w-0">
      <p className="text-[13px] text-muted-foreground">{rotulo}</p>
      <p className="text-2xl font-semibold truncate">{valor}</p>
      {variacao !== undefined && variacao !== null && (
        <p
          className={`mt-0.5 text-[13px] flex items-center gap-0.5 ${
            variacao > 0 ? "text-success" : "text-muted-foreground"
          }`}
        >
          {variacao > 0 && <ArrowUpRight className="w-3 h-3" aria-hidden />}
          {variacao < 0 && <ArrowDownRight className="w-3 h-3" aria-hidden />}
          {variacao > 0 ? "+" : ""}
          {variacao}% vs. anterior
        </p>
      )}
      {nota && <p className="mt-0.5 text-[13px] text-muted-foreground">{nota}</p>}
    </div>
  );
}
