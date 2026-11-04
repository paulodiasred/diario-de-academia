import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash2,
  Copy,
  Pencil,
} from "lucide-react";
import { TelaCarregando } from "@/components/Estados";
import { Cabecalho } from "@/components/Cabecalho";
import { BannerSessaoAtiva } from "@/components/treino/BannerSessaoAtiva";
import { BotaoIniciarTreino } from "@/components/treino/BotaoIniciarTreino";
import type { TreinoPersonalizado } from "@/types/catalogo";
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
import { ErrorState } from "@/components/ErrorState";
import { LIMITES_GRATUITO, LimiteDoPlano } from "@/domain/planos";
import { useMeusTreinos } from "@/hooks/useMeusTreinos";
import { usePlano } from "@/hooks/usePlano";
import { MUSCULO_LABEL, CATEGORIA_LABEL, DIAS_SEMANA } from "@/types/catalogo";
import { toast } from "sonner";

const MeusTreinos = () => {
  const navigate = useNavigate();
  const { treinos: todosTreinos, loading, erro, recarregar, deletarTreino, criarTreino } =
    useMeusTreinos();
  const plano = usePlano();
  // O Desfazer roda depois da exclusão: precisa da contagem do plano já com a vaga devolvida.
  const criarTreinoAtual = useRef(criarTreino);
  criarTreinoAtual.current = criarTreino;
  const [deletandoId, setDeletandoId] = useState<string | null>(null);
  const [musculo, setMusculo] = useState("");

  const musculosDisponiveis = [
    ...new Set(todosTreinos.flatMap((t) => t.exercicios.flatMap((e) => e.primaryMuscles))),
  ].sort();
  const treinos = musculo
    ? todosTreinos.filter((t) => t.exercicios.some((e) => e.primaryMuscles.includes(musculo)))
    : todosTreinos;

  const handleDuplicar = async (treino: TreinoPersonalizado) => {
    try {
      await criarTreino({
        nome: `${treino.nome} (cópia)`.slice(0, 120),
        descricao: treino.descricao,
        // Sem dias: a cópia não entra na semana até o usuário decidir.
        dias: [],
        exercicios: treino.exercicios,
      });
      toast.success("Cópia criada, sem dias definidos");
    } catch (erro) {
      if (erro instanceof LimiteDoPlano) navigate("/planos");
      toast.error(erro instanceof LimiteDoPlano ? erro.message : "Não foi possível duplicar o treino");
    }
  };

  const desfazerExclusao = async (treino: TreinoPersonalizado) => {
    try {
      await criarTreinoAtual.current({
        nome: treino.nome,
        descricao: treino.descricao,
        dias: treino.dias,
        exercicios: treino.exercicios,
      });
    } catch (erro) {
      toast.error(erro instanceof LimiteDoPlano ? erro.message : "Não foi possível recuperar o treino");
    }
  };

  const handleDeletar = async () => {
    if (!deletandoId) return;
    const excluido = todosTreinos.find((t) => t.id === deletandoId);
    try {
      await deletarTreino(deletandoId);
      if (excluido) {
        toast.success("Treino excluído", {
          duration: 6000,
          action: { label: "Desfazer", onClick: () => void desfazerExclusao(excluido) },
        });
      }
    } catch {
      toast.error("Erro ao excluir treino");
    } finally {
      setDeletandoId(null);
    }
  };

  if (erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar seus treinos"
        onTentarNovamente={() => void recarregar()}
      />
    );
  }

  if (loading) {
    return (
      <TelaCarregando />
    );
  }

  return (
    <>
      <div className="min-h-screen p-4 pb-24 max-w-md mx-auto">
        <div className="space-y-6">
          <Cabecalho
            titulo="Meus Treinos"
            subtitulo={`${todosTreinos.length} treino${todosTreinos.length !== 1 ? "s" : ""} salvo${todosTreinos.length !== 1 ? "s" : ""}`}
          />

          {/* Com treinos na lista, criar outro deixa de ser a ação principal. */}
          <Button
            variant={todosTreinos.length > 0 ? "outline" : "default"}
            onClick={() => navigate(plano.podeCriar("treinos") ? "/meus-treinos/criar" : "/planos")}
            className="w-full h-12 gap-2"
          >
            <Plus className="w-5 h-5" />
            Criar novo treino
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/meus-treinos/modelos")}
            className="w-full h-11 -mt-3"
          >
            Usar um modelo pronto
          </Button>

          {!plano.premium && !plano.carregando && (
            <p className="text-[13px] text-muted-foreground -mt-2">
              {plano.podeCriar("treinos")
                ? `${plano.uso.treinos} de ${LIMITES_GRATUITO.treinos} treinos do plano gratuito`
                : `Você usou os ${LIMITES_GRATUITO.treinos} treinos do plano gratuito. Exclua um ou conheça o Premium.`}
            </p>
          )}

          <BannerSessaoAtiva />

          {musculosDisponiveis.length > 1 && (
            <select
              aria-label="Filtrar por grupo muscular"
              className="h-11 w-full rounded-md border border-input bg-secondary/30 px-3 text-sm"
              value={musculo}
              onChange={(e) => setMusculo(e.target.value)}
            >
              <option value="">Todos os grupos musculares</option>
              {musculosDisponiveis.map((m) => (
                <option key={m} value={m}>
                  {MUSCULO_LABEL[m] ?? m}
                </option>
              ))}
            </select>
          )}

          {/* Lista de treinos */}
          <>
            {todosTreinos.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <p className="text-muted-foreground">
                  Você ainda não tem treinos salvos.
                </p>
                <p className="text-sm text-muted-foreground">
                  Crie seu primeiro treino personalizado!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {treinos.map((treino) => {
                  const musculos = [
                    ...new Set(
                      treino.exercicios.flatMap((e) => e.primaryMuscles)
                    ),
                  ].slice(0, 3);

                  const categorias = [
                    ...new Set(treino.exercicios.map((e) => e.category)),
                  ];

                  return (
                    <div key={treino.id} className="glass-card rounded-xl p-4 space-y-3">
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
                          <p className="text-[13px] text-muted-foreground mt-1">
                            {treino.exercicios.length} exercício
                            {treino.exercicios.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>

                      {/* Dias, músculos e categorias na mesma linha */}
                      <div className="flex flex-wrap gap-1">
                        {treino.dias && treino.dias.length > 0 && (
                          <>
                          {DIAS_SEMANA.filter((d) =>
                            treino.dias.includes(d)
                          ).map((dia) => (
                            <span
                              key={dia}
                              className="text-[13px] px-2 py-0.5 bg-primary/15 text-primary rounded-full font-medium"
                            >
                              {dia}
                            </span>
                          ))}
                          </>
                        )}
                        {musculos.map((m) => (
                          <span
                            key={m}
                            className="text-[13px] px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                          >
                            {MUSCULO_LABEL[m] ?? m}
                          </span>
                        ))}
                        {categorias.map((c) => (
                          <span
                            key={c}
                            className="text-[13px] px-2 py-0.5 bg-secondary/50 text-muted-foreground rounded-full"
                          >
                            {CATEGORIA_LABEL[c] ?? c}
                          </span>
                        ))}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <BotaoIniciarTreino
                          treino={treino}
                          className="flex-1 rounded-lg h-11 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-lg h-11 w-11"
                          aria-label={`Editar ${treino.nome}`}
                          onClick={() =>
                            navigate(`/meus-treinos/editar/${treino.id}`)
                          }
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-lg h-11 w-11"
                          aria-label={`Duplicar ${treino.nome}`}
                          onClick={() => handleDuplicar(treino)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-lg h-11 w-11 text-destructive border-destructive/30 hover:bg-destructive/10"
                          aria-label={`Excluir ${treino.nome}`}
                          onClick={() => setDeletandoId(treino.id!)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        </div>
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
    </>
  );
};

export default MeusTreinos;
