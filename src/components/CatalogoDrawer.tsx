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
import { CampoSelect } from "@/components/ui/campo-select";
import { ChipFiltro } from "@/components/ui/chip";
import { GRUPOS_MUSCULARES } from "@/domain/catalogo";
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
              className="pl-9 bg-surface-2"
            />
            {filtros.busca && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => setFiltros((f) => ({ ...f, busca: "" }))}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div role="group" aria-label="Grupo muscular" className="-mx-4 px-4 flex gap-1.5 overflow-x-auto pb-1">
            {GRUPOS_MUSCULARES.map((grupo) => {
              const ativo = filtros.grupo === grupo.id;
              return (
                <ChipFiltro
                  key={grupo.id}
                  ativo={ativo}
                  onClick={() => setFiltros((f) => ({ ...f, grupo: ativo ? "" : grupo.id }))}
                >
                  {grupo.rotulo}
                </ChipFiltro>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-caption h-9 gap-1"
              onClick={() => setCriando(true)}
            >
              <Plus className="w-3 h-3" />
              Criar exercício
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-caption h-9 gap-1"
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
                className="text-caption h-8 text-muted-foreground"
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
                  <CampoSelect
                    aria-label="Categoria"
                    value={filtros.categoria}
                    onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}
                  >
                    <option value="">Categorias</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORIA_LABEL[c] ?? c}
                      </option>
                    ))}
                  </CampoSelect>

                  <CampoSelect
                    aria-label="Músculo"
                    value={filtros.musculo}
                    onChange={(e) => setFiltros((f) => ({ ...f, musculo: e.target.value }))}
                  >
                    <option value="">Músculos</option>
                    {musculos.map((m) => (
                      <option key={m} value={m}>
                        {MUSCULO_LABEL[m] ?? m}
                      </option>
                    ))}
                  </CampoSelect>

                  <CampoSelect
                    aria-label="Nível"
                    value={filtros.nivel}
                    onChange={(e) => setFiltros((f) => ({ ...f, nivel: e.target.value }))}
                  >
                    <option value="">Níveis</option>
                    {niveis.map((n) => (
                      <option key={n} value={n}>
                        {NIVEL_LABEL[n] ?? n}
                      </option>
                    ))}
                  </CampoSelect>

                  <CampoSelect
                    aria-label="Equipamento"
                    value={filtros.equipamento}
                    onChange={(e) => setFiltros((f) => ({ ...f, equipamento: e.target.value }))}
                  >
                    <option value="">Equipamentos</option>
                    {equipamentos.map((eq) => (
                      <option key={eq} value={eq}>
                        {EQUIPAMENTO_LABEL[eq] ?? eq}
                      </option>
                    ))}
                  </CampoSelect>
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
                    <div className="py-3 flex items-center gap-3">
                      <button
                        type="button"
                        aria-expanded={aberto}
                        aria-label={`${aberto ? "Recolher" : "Ver detalhes de"} ${ex.name}`}
                        onClick={() => setExpandido(aberto ? null : ex.id)}
                        className="flex-1 min-w-0 flex items-center gap-3 text-left"
                      >
                        {/* Thumbnail */}
                        <ImagemExercicio caminho={ex.images?.[0]} alt="" className="w-14 h-14 shrink-0" />

                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-sm leading-tight">
                            {ex.name}
                          </span>
                          <span className="block mt-0.5 text-caption text-muted-foreground">
                            {[
                              ex.proprio ? "Seu" : null,
                              ...ex.primaryMuscles.slice(0, 2).map((m) => MUSCULO_LABEL[m] ?? m),
                              ex.proprio ? null : (NIVEL_LABEL[ex.level] ?? ex.level),
                              ex.equipment ? (EQUIPAMENTO_LABEL[ex.equipment] ?? ex.equipment) : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </span>
                      </button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="shrink-0 h-11 w-11 p-0"
                        aria-label={`Adicionar ${ex.name}`}
                        onClick={() => {
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
                              <p className="text-caption text-muted-foreground mb-2">
                                Secundários:{" "}
                                {ex.secondaryMuscles.map((m) => MUSCULO_LABEL[m] ?? m).join(", ")}
                              </p>
                            )}
                            <p className="text-caption font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
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
              <p className="text-center text-caption text-muted-foreground py-3">
                Mostrando 100 de {total}. Refine a busca para ver mais.
              </p>
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border/50 flex items-center gap-3">
          <p className="flex-1 text-sm text-muted-foreground" role="status">
            {exerciciosAdicionados.length === 0
              ? "Nenhum exercício adicionado"
              : `${exerciciosAdicionados.length} adicionado${exerciciosAdicionados.length !== 1 ? "s" : ""}`}
          </p>
          <Button className="h-11 px-6" onClick={onClose}>
            Concluir
          </Button>
        </div>
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
