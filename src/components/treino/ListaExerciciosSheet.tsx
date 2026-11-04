import { Check, Plus, Repeat2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { podeAlterarExercicio, type Sessao } from "@/domain/sessao";

interface ListaExerciciosSheetProps {
  sessao: Sessao;
  aberto: boolean;
  onFechar: () => void;
  onIr: (indice: number) => void;
  onTrocar: (indice: number) => void;
  onRemover: (indice: number) => void;
  onAdicionar: () => void;
}

export function ListaExerciciosSheet({
  sessao,
  aberto,
  onFechar,
  onIr,
  onTrocar,
  onRemover,
  onAdicionar,
}: ListaExerciciosSheetProps) {
  const total = sessao.exercicios.length;

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">Exercícios do treino</SheetTitle>
        </SheetHeader>
        <p className="pt-1 text-sm text-muted-foreground">
          Trocar, remover ou adicionar vale só para hoje: sua ficha continua como está.
        </p>

        <ul className="pt-3 divide-y divide-border/60">
          {sessao.exercicios.map((e, i) => {
            const feitas = e.series.filter((s) => s.concluida).length;
            const completo = feitas === e.series.length;
            const atual = i === sessao.exercicioAtual;
            return (
              <li key={`${e.exercicioId}-${i}`} className="flex items-center gap-1 py-1">
                <button
                  type="button"
                  aria-label={`Ir para ${e.nome}`}
                  aria-current={atual ? "step" : undefined}
                  onClick={() => onIr(i)}
                  className="flex-1 min-w-0 min-h-11 py-1.5 flex items-center gap-2.5 text-left"
                >
                  <span
                    aria-hidden
                    className={`h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-caption font-semibold ${
                      atual
                        ? "bg-foreground text-background"
                        : completo
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {completo && !atual ? <Check className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium">{e.nome}</span>
                    <span className="block text-caption text-muted-foreground">
                      {feitas} de {e.series.length} séries
                    </span>
                  </span>
                </button>
                {podeAlterarExercicio(e) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0"
                    aria-label={`Trocar ${e.nome}`}
                    onClick={() => onTrocar(i)}
                  >
                    <Repeat2 className="w-4 h-4" />
                  </Button>
                )}
                {podeAlterarExercicio(e) && total > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 shrink-0 text-destructive"
                    aria-label={`Remover ${e.nome} do treino de hoje`}
                    onClick={() => onRemover(i)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>

        <Button variant="outline" className="mt-3 w-full h-11 gap-1.5" onClick={onAdicionar}>
          <Plus className="w-4 h-4" />
          Adicionar exercício
        </Button>
      </SheetContent>
    </Sheet>
  );
}
