import { useState } from "react";
import { Check, Search, X, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import { ExercicioProprioForm } from "@/components/ExercicioProprioForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCatalogoExercicios } from "@/hooks/useCatalogoExercicios";
import type { ExercicioCatalogo } from "@/types/catalogo";
import {
  NIVEL_LABEL,
  CATEGORIA_LABEL,
  MUSCULO_LABEL,
  EQUIPAMENTO_LABEL,
} from "@/types/catalogo";

interface CatalogoDrawerProps {
  open: boolean;
  onClose: () => void;
  onAdicionar: (exercicio: ExercicioCatalogo) => void;
  exerciciosAdicionados: string[];
}

export function CatalogoDrawer({
  open,
  onClose,
  onAdicionar,
  exerciciosAdicionados,
}: CatalogoDrawerProps) {
  const {
    exerciciosFiltrados,
    filtros,
    setFiltros,
    categorias,
    musculos,
    niveis,
    equipamentos,
    limparFiltros,
    total,
  } = useCatalogoExercicios();

  const [expandido, setExpandido] = useState<string | null>(null);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [criando, setCriando] = useState(false);

  const temFiltros =
    filtros.categoria ||
    filtros.musculo ||
    filtros.nivel ||
    filtros.equipamento;

  return (
    <MotionConfig reducedMotion="user">
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] flex flex-col p-0 rounded-t-2xl"
      >
        <SheetHeader className="px-4 pt-5 pb-3 border-b border-border/50">
          <SheetTitle className="text-left text-lg font-bold">
            Catálogo de Exercícios
          </SheetTitle>
          <p className="text-sm text-muted-foreground text-left">
            {total} exercício{total !== 1 ? "s" : ""} encontrado
            {total !== 1 ? "s" : ""}
          </p>
        </SheetHeader>

        {/* Busca e filtros */}
        <div className="px-4 py-3 space-y-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={filtros.busca}
              onChange={(e) =>
                setFiltros((f) => ({ ...f, busca: e.target.value }))
              }
              className="pl-9 bg-secondary/30"
            />
            {filtros.busca && (
              <button
                onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[13px] h-9 gap-1"
              onClick={() => setCriando(true)}
            >
              <Plus className="w-3 h-3" />
              Criar exercício
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-[13px] h-9 gap-1"
              onClick={() => setMostrarFiltros((v) => !v)}
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${mostrarFiltros ? "rotate-180" : ""}`}
              />
              Filtros
              {temFiltros && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
            {temFiltros && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[13px] h-8 text-muted-foreground"
                onClick={limparFiltros}
              >
                Limpar
              </Button>
            )}
          </div>

          <AnimatePresence>
            {mostrarFiltros && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Select
                    value={filtros.categoria || "all"}
                    onValueChange={(v) =>
                      setFiltros((f) => ({
                        ...f,
                        categoria: v === "all" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-[13px] bg-secondary/30">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas categorias</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORIA_LABEL[c] ?? c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.musculo || "all"}
                    onValueChange={(v) =>
                      setFiltros((f) => ({
                        ...f,
                        musculo: v === "all" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-[13px] bg-secondary/30">
                      <SelectValue placeholder="Músculo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos músculos</SelectItem>
                      {musculos.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MUSCULO_LABEL[m] ?? m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.nivel || "all"}
                    onValueChange={(v) =>
                      setFiltros((f) => ({
                        ...f,
                        nivel: v === "all" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-[13px] bg-secondary/30">
                      <SelectValue placeholder="Nível" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos níveis</SelectItem>
                      {niveis.map((n) => (
                        <SelectItem key={n} value={n}>
                          {NIVEL_LABEL[n] ?? n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={filtros.equipamento || "all"}
                    onValueChange={(v) =>
                      setFiltros((f) => ({
                        ...f,
                        equipamento: v === "all" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="h-8 text-[13px] bg-secondary/30">
                      <SelectValue placeholder="Equipamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos equipamentos</SelectItem>
                      {equipamentos.map((eq) => (
                        <SelectItem key={eq} value={eq}>
                          {EQUIPAMENTO_LABEL[eq] ?? eq}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lista */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-2 space-y-2">
            {exerciciosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum exercício encontrado</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={limparFiltros}
                >
                  Limpar filtros
                </Button>
              </div>
            ) : (
              exerciciosFiltrados.slice(0, 100).map((ex) => {
                const jaAdicionado = exerciciosAdicionados.includes(ex.id);
                const aberto = expandido === ex.id;

                return (
                  <div
                    key={ex.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <div
                      className="py-3 flex items-center gap-3"
                      onClick={() =>
                        setExpandido(aberto ? null : ex.id)
                      }
                    >
                      {/* Thumbnail */}
                      <ImagemExercicio caminho={ex.images?.[0]} alt="" className="w-14 h-14 shrink-0" />

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {ex.name}
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          {[
                            ex.proprio ? "Seu" : null,
                            ...ex.primaryMuscles.slice(0, 2).map((m) => MUSCULO_LABEL[m] ?? m),
                            ex.proprio ? null : (NIVEL_LABEL[ex.level] ?? ex.level),
                            ex.equipment ? (EQUIPAMENTO_LABEL[ex.equipment] ?? ex.equipment) : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 h-11 w-11 p-0"
                        aria-label={`Adicionar ${ex.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!jaAdicionado) onAdicionar(ex);
                        }}
                        disabled={jaAdicionado}
                      >
                        {jaAdicionado ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>

                    <AnimatePresence>
                      {aberto && ex.instructions.length > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 border-t border-border/30 pt-2">
                            {/* Imagens do exercício */}
                            {ex.images && ex.images.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-3">
                                {ex.images.map((img, i) => (
                                  <ImagemExercicio
                                    key={img}
                                    caminho={img}
                                    alt={`${ex.name}, ${i === 0 ? "início" : "fim"} do movimento`}
                                    className="w-full aspect-square"
                                  />
                                ))}
                              </div>
                            )}
                            {ex.secondaryMuscles.length > 0 && (
                              <p className="text-[13px] text-muted-foreground mb-2">
                                Secundários:{" "}
                                {ex.secondaryMuscles.map((m) => MUSCULO_LABEL[m] ?? m).join(", ")}
                              </p>
                            )}
                            <p className="text-[13px] font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                              Como executar
                            </p>
                            <ol className="space-y-1">
                              {ex.instructions.map((step, i) => (
                                <li
                                  key={i}
                                  className="text-sm flex gap-2"
                                >
                                  <span className="text-primary font-bold shrink-0">
                                    {i + 1}.
                                  </span>
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
            {exerciciosFiltrados.length > 100 && (
              <p className="text-center text-[13px] text-muted-foreground py-3">
                Mostrando 100 de {total}. Refine a busca para ver mais.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
      <ExercicioProprioForm
        aberto={criando}
        onFechar={() => setCriando(false)}
        onSalvo={onAdicionar}
      />
    </Sheet>
    </MotionConfig>
  );
}
