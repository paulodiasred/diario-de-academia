import { useState } from "react";
import { Search, X, Plus, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getExerciseImageUrl } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const temFiltros =
    filtros.categoria ||
    filtros.musculo ||
    filtros.nivel ||
    filtros.equipamento;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] flex flex-col p-0 rounded-t-3xl"
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
              className="text-xs h-8 gap-1"
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
                className="text-xs h-8 text-muted-foreground"
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
                    <SelectTrigger className="h-8 text-xs bg-secondary/30">
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
                    <SelectTrigger className="h-8 text-xs bg-secondary/30">
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
                    <SelectTrigger className="h-8 text-xs bg-secondary/30">
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
                    <SelectTrigger className="h-8 text-xs bg-secondary/30">
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
                <p className="text-4xl mb-3">🔍</p>
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
                    className="glass-card rounded-2xl overflow-hidden"
                  >
                    <div
                      className="p-3 flex items-start gap-3"
                      onClick={() =>
                        setExpandido(aberto ? null : ex.id)
                      }
                    >
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary/50 shrink-0">
                        {ex.images && ex.images[0] ? (
                          <img
                            src={getExerciseImageUrl(ex.images[0])}
                            alt={ex.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🏋️
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">
                          {ex.name}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ex.primaryMuscles.slice(0, 2).map((m) => (
                            <Badge
                              key={m}
                              variant="secondary"
                              className="text-xs px-1.5 py-0"
                            >
                              {MUSCULO_LABEL[m] ?? m}
                            </Badge>
                          ))}
                          {ex.level && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              {NIVEL_LABEL[ex.level] ?? ex.level}
                            </Badge>
                          )}
                          {ex.equipment && (
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0 text-muted-foreground"
                            >
                              {EQUIPAMENTO_LABEL[ex.equipment] ?? ex.equipment}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={jaAdicionado ? "secondary" : "default"}
                        className="shrink-0 h-8 w-8 p-0 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!jaAdicionado) onAdicionar(ex);
                        }}
                        disabled={jaAdicionado}
                      >
                        <Plus className="w-4 h-4" />
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
                              <div className="flex gap-2 mb-3">
                                {ex.images.map((img, i) => (
                                  <img
                                    key={i}
                                  src={getExerciseImageUrl(img)}
                                  alt={`${ex.name} ${i + 1}`}
                                    className="w-28 h-20 object-cover rounded-xl bg-secondary/50"
                                    loading="lazy"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                            <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                              Como executar
                            </p>
                            <ol className="space-y-1">
                              {ex.instructions.map((step, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-muted-foreground flex gap-2"
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
              <p className="text-center text-xs text-muted-foreground py-3">
                Mostrando 100 de {total}. Refine a busca para ver mais.
              </p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
