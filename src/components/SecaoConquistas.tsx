import { useMemo } from "react";
import { Award, Lock } from "lucide-react";
import { calcularConquistas } from "@/domain/conquistas";
import type { Sessao } from "@/domain/sessao";

interface SecaoConquistasProps {
  sessoes: Sessao[];
  premium: boolean;
}

export function SecaoConquistas({ sessoes, premium }: SecaoConquistasProps) {
  const conquistas = useMemo(() => calcularConquistas(sessoes), [sessoes]);
  const liberadas = conquistas.filter((c) => premium || !c.premium);
  const obtidas = liberadas.filter((c) => c.obtida).length;
  const bloqueadas = conquistas.length - liberadas.length;

  return (
    <section aria-label="Conquistas" className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold">Conquistas</h2>
        <span className="text-sm text-muted-foreground">
          {obtidas} de {liberadas.length}
        </span>
      </div>
      <ul className="glass-card rounded-xl divide-y divide-border/60">
        {liberadas.map((c) => (
          <li key={c.id} className="p-3 flex items-center gap-3">
            <Award
              aria-hidden
              className={`w-5 h-5 shrink-0 ${c.obtida ? "text-primary" : "text-muted-foreground/50"}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${c.obtida ? "" : "text-muted-foreground"}`}>{c.titulo}</p>
              <p className="text-caption text-muted-foreground">{c.descricao}</p>
            </div>
            <span className="text-caption text-muted-foreground shrink-0 tabular-nums">
              {c.obtida
                ? "Obtida"
                : `${Math.min(c.atual, c.alvo).toLocaleString("pt-BR")}/${c.alvo.toLocaleString("pt-BR")}`}
            </span>
          </li>
        ))}
        {bloqueadas > 0 && (
          <li className="p-3 flex items-center gap-3 text-caption text-muted-foreground">
            <Lock className="w-4 h-4 shrink-0" aria-hidden />
            Mais {bloqueadas} conquistas no Premium
          </li>
        )}
      </ul>
    </section>
  );
}
