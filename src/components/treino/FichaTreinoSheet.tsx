import { useNavigate } from "react-router-dom";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import { BotaoIniciarTreino } from "@/components/treino/BotaoIniciarTreino";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { resumirConfiguracao } from "@/domain/catalogo";
import type { TreinoPersonalizado } from "@/types/catalogo";
import { DIAS_SEMANA } from "@/types/catalogo";

interface FichaTreinoSheetProps {
  treino: TreinoPersonalizado | null;
  onFechar: () => void;
  onDuplicar: (treino: TreinoPersonalizado) => void;
  onExcluir: (treino: TreinoPersonalizado) => void;
}

/** Ver a ficha antes de começar, sem o risco de alterar algo por estar na tela de edição. */
export function FichaTreinoSheet({ treino, onFechar, onDuplicar, onExcluir }: FichaTreinoSheetProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={!!treino} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        {treino && (
          <>
            <SheetHeader>
              <SheetTitle className="text-left">{treino.nome}</SheetTitle>
            </SheetHeader>
            <p className="pt-1 text-sm text-muted-foreground">
              {DIAS_SEMANA.filter((d) => treino.dias?.includes(d)).join(", ") || "Sem dia definido"}
            </p>
            {treino.descricao && <p className="pt-1 text-sm text-muted-foreground">{treino.descricao}</p>}

            <ol className="mt-3 divide-y divide-border/60">
              {[...treino.exercicios]
                .sort((a, b) => a.ordem - b.ordem)
                .map((ex) => (
                  <li key={ex.exercicioId} className="py-2 flex items-center gap-2.5">
                    <ImagemExercicio caminho={ex.images?.[0]} alt="" className="w-10 h-10 shrink-0" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium leading-tight">{ex.exercicioNome}</span>
                      <span className="block text-caption text-muted-foreground">{resumirConfiguracao(ex)}</span>
                    </span>
                  </li>
                ))}
            </ol>

            <BotaoIniciarTreino treino={treino} destaque className="mt-3 w-full h-12" />

            <div className="mt-2 grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="gap-1.5 px-2"
                aria-label={`Editar ${treino.nome}`}
                onClick={() => navigate(`/meus-treinos/editar/${treino.id}`)}
              >
                <Pencil className="w-4 h-4" />
                Editar
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 px-2"
                aria-label={`Duplicar ${treino.nome}`}
                onClick={() => onDuplicar(treino)}
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </Button>
              <Button
                variant="outline"
                className="gap-1.5 px-2 text-destructive"
                aria-label={`Excluir ${treino.nome}`}
                onClick={() => onExcluir(treino)}
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
