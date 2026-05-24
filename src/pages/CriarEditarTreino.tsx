import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  BookOpen,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CatalogoDrawer } from "@/components/CatalogoDrawer";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import type { ExercicioCatalogo, ExercicioNoTreino } from "@/types/catalogo";
import { MUSCULO_LABEL, CATEGORIA_LABEL, DIAS_SEMANA } from "@/types/catalogo";
import { getExerciseImageUrl } from "@/lib/utils";
import { toast } from "sonner";

const CriarEditarTreino = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdicao = !!id;

  const { treinos, criarTreino, atualizarTreino } = useMeusTreinos();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dias, setDias] = useState<string[]>([]);
  const [exercicios, setExercicios] = useState<ExercicioNoTreino[]>([]);
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Carregar dados para edição
  useEffect(() => {
    if (isEdicao && treinos.length > 0) {
      const treino = treinos.find((t) => t.id === id);
      if (treino) {
        setNome(treino.nome);
        setDescricao(treino.descricao ?? "");
        setDias(treino.dias ?? []);
        setExercicios(treino.exercicios);
      }
    }
  }, [id, isEdicao, treinos]);

  const toggleDia = (dia: string) => {
    setDias((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]
    );
  };

  const adicionarExercicio = (ex: ExercicioCatalogo) => {
    const novoExercicio: ExercicioNoTreino = {
      exercicioId: ex.id,
      exercicioNome: ex.name,
      primaryMuscles: ex.primaryMuscles,
      category: ex.category,
      series: 3,
      descanso: 60,
      ordem: exercicios.length,
      images: ex.images,
    };
    setExercicios((prev) => [...prev, novoExercicio]);
    toast.success(`"${ex.name}" adicionado!`);
  };

  const removerExercicio = (exercicioId: string) => {
    setExercicios((prev) =>
      prev
        .filter((e) => e.exercicioId !== exercicioId)
        .map((e, i) => ({ ...e, ordem: i }))
    );
  };

  const atualizarCampo = (
    exercicioId: string,
    campo: "series" | "descanso",
    valor: number
  ) => {
    setExercicios((prev) =>
      prev.map((e) =>
        e.exercicioId === exercicioId ? { ...e, [campo]: valor } : e
      )
    );
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Dê um nome ao treino");
      return;
    }
    if (exercicios.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        dias,
        exercicios,
      };

      if (isEdicao && id) {
        await atualizarTreino(id, dados);
        toast.success("Treino atualizado!");
      } else {
        await criarTreino(dados);
        toast.success("Treino criado!");
      }
      navigate("/meus-treinos");
    } catch {
      toast.error("Erro ao salvar treino");
    } finally {
      setSalvando(false);
    }
  };

  const exerciciosAdicionadosIds = exercicios.map((e) => e.exercicioId);

  return (
    <>
      <div className="min-h-screen p-4 max-w-md mx-auto pb-32">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => navigate("/meus-treinos")}
              className="p-2 rounded-lg hover:bg-secondary/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex-1">
              {isEdicao ? "Editar treino" : "Novo treino"}
            </h1>
            <Button
              onClick={salvar}
              disabled={salvando}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl h-9 gap-1.5 text-sm"
            >
              <Save className="w-4 h-4" />
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          {/* Nome e descrição */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Nome do treino *
              </label>
              <Input
                placeholder="Ex: Peito e Tríceps"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="bg-secondary/30 border-secondary"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">
                Descrição (opcional)
              </label>
              <Textarea
                placeholder="Ex: Treino de hipertrofia, foco em volume"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="bg-secondary/30 border-secondary resize-none text-sm"
                rows={2}
              />
            </div>
          </div>

          {/* Dias da semana */}
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Dias da semana</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {dias.length === 0 ? "Nenhum selecionado" : `${dias.length} dia${dias.length !== 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map((dia) => {
                const selecionado = dias.includes(dia);
                return (
                  <button
                    key={dia}
                    onClick={() => toggleDia(dia)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                      selecionado
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/30 text-muted-foreground border-secondary hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercícios adicionados */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                Exercícios{" "}
                <span className="text-muted-foreground font-normal text-sm">
                  ({exercicios.length})
                </span>
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs rounded-xl"
                onClick={() => setCatalogoAberto(true)}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Catálogo
              </Button>
            </div>

            <AnimatePresence>
              {exercicios.length === 0 ? (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => setCatalogoAberto(true)}
                  className="w-full glass-card rounded-2xl p-8 text-center border-dashed hover:border-primary/40 transition-colors"
                >
                  <div className="text-4xl mb-3">🏋️</div>
                  <p className="text-muted-foreground text-sm">
                    Nenhum exercício adicionado
                  </p>
                  <p className="text-primary text-sm mt-1 font-medium flex items-center justify-center gap-1">
                    <Plus className="w-4 h-4" />
                    Abrir catálogo
                  </p>
                </motion.button>
              ) : (
                <div className="space-y-2">
                  {exercicios.map((ex, index) => (
                    <motion.div
                      key={ex.exercicioId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.03 }}
                      className="glass-card rounded-2xl p-3"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />

                        {/* Thumbnail */}
                        {ex.images && ex.images[0] && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary/50 shrink-0 mt-0.5">
                            <img
                              src={getExerciseImageUrl(ex.images[0])}
                              alt={ex.exercicioNome}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm leading-tight">
                            {ex.exercicioNome}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ex.primaryMuscles.slice(0, 2).map((m) => (
                              <Badge
                                key={m}
                                variant="secondary"
                                className="text-xs px-1.5 py-0"
                              >
                                {MUSCULO_LABEL[m] ?? m}
                              </Badge>
                            ))}
                            <Badge
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              {CATEGORIA_LABEL[ex.category] ?? ex.category}
                            </Badge>
                          </div>

                          {/* Controles de séries e descanso */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">
                                Séries:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  className="w-6 h-6 rounded-full bg-secondary/70 flex items-center justify-center text-sm font-bold hover:bg-secondary"
                                  onClick={() =>
                                    atualizarCampo(
                                      ex.exercicioId,
                                      "series",
                                      Math.max(1, ex.series - 1)
                                    )
                                  }
                                >
                                  −
                                </button>
                                <span className="w-5 text-center text-sm font-semibold">
                                  {ex.series}
                                </span>
                                <button
                                  className="w-6 h-6 rounded-full bg-secondary/70 flex items-center justify-center text-sm font-bold hover:bg-secondary"
                                  onClick={() =>
                                    atualizarCampo(
                                      ex.exercicioId,
                                      "series",
                                      Math.min(10, ex.series + 1)
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground">
                                Descanso:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  className="w-6 h-6 rounded-full bg-secondary/70 flex items-center justify-center text-sm font-bold hover:bg-secondary"
                                  onClick={() =>
                                    atualizarCampo(
                                      ex.exercicioId,
                                      "descanso",
                                      Math.max(0, ex.descanso - 15)
                                    )
                                  }
                                >
                                  −
                                </button>
                                <span className="w-10 text-center text-sm font-semibold">
                                  {ex.descanso}s
                                </span>
                                <button
                                  className="w-6 h-6 rounded-full bg-secondary/70 flex items-center justify-center text-sm font-bold hover:bg-secondary"
                                  onClick={() =>
                                    atualizarCampo(
                                      ex.exercicioId,
                                      "descanso",
                                      Math.min(300, ex.descanso + 15)
                                    )
                                  }
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => removerExercicio(ex.exercicioId)}
                          className="p-1.5 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}

                  {/* Botão de adicionar mais */}
                  <button
                    onClick={() => setCatalogoAberto(true)}
                    className="w-full glass-card rounded-2xl p-3 text-center text-sm text-primary hover:border-primary/40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar exercício
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <CatalogoDrawer
        open={catalogoAberto}
        onClose={() => setCatalogoAberto(false)}
        onAdicionar={adicionarExercicio}
        exerciciosAdicionados={exerciciosAdicionadosIds}
      />
    </>
  );
};

export default CriarEditarTreino;
