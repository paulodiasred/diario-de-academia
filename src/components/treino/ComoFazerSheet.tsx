import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ExercicioDetalhes } from "@/components/ExercicioDetalhes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { encontrarExercicio, sugerirExercicios } from "@/domain/catalogo";
import { slug } from "@/domain/texto";
import { useCatalogoExercicios } from "@/hooks/useCatalogoExercicios";
import { usePerfil } from "@/hooks/usePerfil";
import type { ExercicioCatalogo } from "@/types/catalogo";

interface ComoFazerSheetProps {
  exercicioId: string;
  nome: string;
  aberto: boolean;
  onFechar: () => void;
}

/** Abre por cima do treino: o timer e as séries continuam como estão. */
export default function ComoFazerSheet({ exercicioId, nome, aberto, onFechar }: ComoFazerSheetProps) {
  const { todos } = useCatalogoExercicios();
  const { vinculos, vincularExercicio } = usePerfil();
  const [escolhido, setEscolhido] = useState<ExercicioCatalogo | null>(null);
  const [trocando, setTrocando] = useState(false);
  const [busca, setBusca] = useState(nome);

  const automatico = useMemo(
    () => encontrarExercicio(todos, exercicioId, nome),
    [todos, exercicioId, nome],
  );
  const salvo = vinculos[slug(nome)];
  const vinculado = useMemo(
    () => (salvo ? (todos.find((e) => e.id === salvo.exercicioId) ?? null) : null),
    [todos, salvo],
  );
  const referencia = automatico ?? vinculado;
  const exibido = escolhido ?? (trocando ? null : referencia);
  const sugestoes = useMemo(() => sugerirExercicios(todos, busca), [todos, busca]);

  const usarSempre = () => {
    if (!escolhido) return;
    vincularExercicio(nome, {
      exercicioId: escolhido.id,
      imagem: escolhido.images[0] ?? null,
    });
    setEscolhido(null);
    setTrocando(false);
  };

  return (
    <Sheet open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">{exibido?.name ?? nome}</SheetTitle>
        </SheetHeader>

        <div className="pt-3 space-y-4">
          {exibido ? (
            <>
              {escolhido && (
                <p className="text-caption text-muted-foreground">
                  Parecido com "{nome}". Confira se é o mesmo movimento antes de usar sempre.
                </p>
              )}
              {!escolhido && !automatico && vinculado && (
                <p className="text-caption text-muted-foreground">Referência que você escolheu para "{nome}".</p>
              )}
              <ExercicioDetalhes exercicio={exibido} />
              {exibido.instructions.length === 0 && exibido.images.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Este exercício ainda não tem imagens nem instruções.
                </p>
              )}
              {escolhido && (
                <div className="space-y-2">
                  <Button className="w-full h-11" onClick={usarSempre}>
                    Usar sempre este
                  </Button>
                  <Button variant="outline" className="w-full h-11" onClick={() => setEscolhido(null)}>
                    Ver outros parecidos
                  </Button>
                </div>
              )}
              {!escolhido && !automatico && vinculado && (
                <Button variant="outline" className="w-full h-11" onClick={() => setTrocando(true)}>
                  Trocar referência
                </Button>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {trocando
                  ? `Escolha outra referência para "${nome}".`
                  : `"${nome}" não está ligado ao catálogo. Escolha o mais parecido para ver como fazer.`}
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  aria-label="Buscar no catálogo"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 h-11 bg-surface-2"
                />
              </div>
              {sugestoes.length === 0 ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  Nada encontrado. Tente uma palavra só, como "supino".
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {sugestoes.map((ex) => (
                    <li key={ex.id}>
                      <button
                        type="button"
                        onClick={() => setEscolhido(ex)}
                        className="w-full min-h-11 py-2.5 text-left text-sm"
                      >
                        {ex.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
