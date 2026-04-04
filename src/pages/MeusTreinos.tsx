import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Dumbbell,
  Trash2,
  Play,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { MUSCULO_LABEL, CATEGORIA_LABEL, DIAS_SEMANA } from "@/types/catalogo";
import { toast } from "sonner";

const MeusTreinos = () => {
  const navigate = useNavigate();
  const { treinos, loading, deletarTreino } = useMeusTreinos();
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  const handleDeletar = async () => {
    if (!deletandoId) return;
    try {
      await deletarTreino(deletandoId);
      toast.success("Treino excluído!");
    } catch {
      toast.error("Erro ao excluir treino");
    } finally {
      setDeletandoId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando treinos...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="pt-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => navigate("/")}
                className="p-2 rounded-lg hover:bg-secondary/50"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
                <Dumbbell className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Meus Treinos</h1>
                <p className="text-muted-foreground text-sm">
                  {treinos.length} treino{treinos.length !== 1 ? "s" : ""}{" "}
                  salvo{treinos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          {/* Criar novo */}
          <Button
            onClick={() => navigate("/meus-treinos/criar")}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-2xl h-12 gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar novo treino
          </Button>

          {/* Lista de treinos */}
          <AnimatePresence>
            {treinos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 space-y-3"
              >
                <div className="text-6xl">🏋️</div>
                <p className="text-muted-foreground">
                  Você ainda não tem treinos salvos.
                </p>
                <p className="text-sm text-muted-foreground">
                  Crie seu primeiro treino personalizado!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {treinos.map((treino, index) => {
                  const musculos = [
                    ...new Set(
                      treino.exercicios.flatMap((e) => e.primaryMuscles)
                    ),
                  ].slice(0, 3);

                  const categorias = [
                    ...new Set(treino.exercicios.map((e) => e.category)),
                  ];

                  return (
                    <motion.div
                      key={treino.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.04 }}
                      className="glass-card rounded-2xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {treino.nome}
                          </h3>
                          {treino.descricao && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {treino.descricao}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {treino.exercicios.length} exercício
                            {treino.exercicios.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Dias da semana */}
                      {treino.dias && treino.dias.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {DIAS_SEMANA.filter((d) =>
                            treino.dias.includes(d)
                          ).map((dia) => (
                            <span
                              key={dia}
                              className="text-xs px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium"
                            >
                              {dia}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Badges de músculos/categorias */}
                      <div className="flex flex-wrap gap-1">
                        {musculos.map((m) => (
                          <span
                            key={m}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {MUSCULO_LABEL[m] ?? m}
                          </span>
                        ))}
                        {categorias.map((c) => (
                          <span
                            key={c}
                            className="text-xs px-2 py-0.5 bg-secondary/50 text-muted-foreground rounded-full"
                          >
                            {CATEGORIA_LABEL[c] ?? c}
                          </span>
                        ))}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() =>
                            navigate(`/meus-treinos/${treino.id}`)
                          }
                          className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90 rounded-xl h-9 gap-1.5 text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-9 w-9"
                          onClick={() =>
                            navigate(`/meus-treinos/editar/${treino.id}`)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-xl h-9 w-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setDeletandoId(treino.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AlertDialog
        open={!!deletandoId}
        onOpenChange={(v) => !v && setDeletandoId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O treino será excluído
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletar}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="mt-8 pb-4 text-center text-muted-foreground text-xs max-w-md mx-auto">
        © 2026 Paulo Dias - Red. Todos os direitos reservados.
      </footer>
    </>
  );
};

export default MeusTreinos;
