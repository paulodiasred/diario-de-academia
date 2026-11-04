import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "@/lib/aviso";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio } from "@/components/Estados";
import { CampoSelect } from "@/components/ui/campo-select";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import { ExercicioDetalhes } from "@/components/ExercicioDetalhes";
import { ExercicioProprioForm } from "@/components/ExercicioProprioForm";
import { exerciciosSemelhantes, useCatalogoExercicios } from "@/hooks/useCatalogoExercicios";
import { useExerciciosProprios } from "@/hooks/useExerciciosProprios";
import { MUSCULO_LABEL, type ExercicioCatalogo } from "@/types/catalogo";

const LIMITE_LISTA = 100;

const rotulosMusculos = (musculos: string[]) =>
  musculos.map((m) => MUSCULO_LABEL[m] ?? m).join(", ");

const Exercicios = () => {
  const { todos, exerciciosFiltrados, filtros, setFiltros, musculos, total } =
    useCatalogoExercicios();
  const { excluir } = useExerciciosProprios();
  const [detalhe, setDetalhe] = useState<ExercicioCatalogo | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editando, setEditando] = useState<ExercicioCatalogo | null>(null);
  const [excluindo, setExcluindo] = useState<ExercicioCatalogo | null>(null);

  const abrirFormulario = (exercicio: ExercicioCatalogo | null) => {
    setEditando(exercicio);
    setFormularioAberto(true);
    setDetalhe(null);
  };

  return (
    <div className="min-h-screen p-4 pb-28 max-w-md mx-auto space-y-4">
      <Cabecalho titulo="Exercícios" subtitulo={`${total} exercício${total !== 1 ? "s" : ""}`}>
        <Button variant="outline" className="h-11 gap-1.5" onClick={() => abrirFormulario(null)}>
          <Plus className="w-4 h-4" />
          Criar
        </Button>
      </Cabecalho>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          aria-label="Buscar exercício"
          placeholder="Buscar exercício..."
          value={filtros.busca}
          onChange={(e) => setFiltros((f) => ({ ...f, busca: e.target.value }))}
          className="pl-9 h-11 bg-surface-2"
        />
      </div>

      <CampoSelect
        aria-label="Filtrar por músculo"
        value={filtros.musculo}
        onChange={(e) => setFiltros((f) => ({ ...f, musculo: e.target.value }))}
      >
        <option value="">Todos os músculos</option>
        {musculos.map((m) => (
          <option key={m} value={m}>
            {MUSCULO_LABEL[m] ?? m}
          </option>
        ))}
      </CampoSelect>

      {exerciciosFiltrados.length === 0 ? (
        <EstadoVazio titulo="Nenhum exercício encontrado" descricao="Tente outra palavra, como o nome do aparelho ou do músculo." />
      ) : (
        <ul className="divide-y divide-border/60">
          {exerciciosFiltrados.slice(0, LIMITE_LISTA).map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => setDetalhe(ex)}
                className="w-full py-3 flex items-center gap-3 text-left"
              >
                <ImagemExercicio caminho={ex.images[0]} alt="" className="w-14 h-14 shrink-0" />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-sm">{ex.name}</span>
                  <span className="block text-caption text-muted-foreground mt-0.5">
                    {rotulosMusculos(ex.primaryMuscles)}
                  </span>
                </span>
                {ex.proprio && <Badge variant="secondary">Seu</Badge>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {exerciciosFiltrados.length > LIMITE_LISTA && (
        <p className="text-center text-caption text-muted-foreground">
          Mostrando {LIMITE_LISTA} de {total}. Refine a busca para ver mais.
        </p>
      )}

      <Sheet open={!!detalhe} onOpenChange={(v) => !v && setDetalhe(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
          {detalhe && (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle className="text-left">{detalhe.name}</SheetTitle>
              </SheetHeader>

              <ExercicioDetalhes exercicio={detalhe} />

              {exerciciosSemelhantes(detalhe, todos).length > 0 && (
                <section>
                  <h3 className="font-semibold text-sm mb-1">Semelhantes</h3>
                  <p className="text-caption text-muted-foreground mb-2">
                    Mesmo músculo principal e equipamento.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exerciciosSemelhantes(detalhe, todos).map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
                        onClick={() => setDetalhe(ex)}
                        className="px-2.5 py-1.5 rounded-lg text-caption bg-surface-2"
                      >
                        {ex.name}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {detalhe.proprio && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-1.5"
                    onClick={() => abrirFormulario(detalhe)}
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-11 gap-1.5 text-destructive"
                    onClick={() => {
                      setExcluindo(detalhe);
                      setDetalhe(null);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ExercicioProprioForm
        aberto={formularioAberto}
        exercicio={editando}
        onFechar={() => setFormularioAberto(false)}
      />

      <AlertDialog open={!!excluindo} onOpenChange={(v) => !v && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{excluindo?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele sai da sua biblioteca. Treinos e o histórico que já usam este exercício não mudam.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (excluindo) {
                  excluir(excluindo.id);
                  toast.success("Exercício excluído");
                }
                setExcluindo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Exercicios;
