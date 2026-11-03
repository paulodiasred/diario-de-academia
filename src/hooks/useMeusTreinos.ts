import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TreinoPersonalizado } from "@/types/catalogo";
import * as repositorio from "@/data/repositories/treinosRepository";
import type { TreinoInput } from "@/domain/schemas";
import { useAuth } from "./useAuth";

const VAZIO: TreinoPersonalizado[] = [];

export function useMeusTreinos() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chave = ["treinos", uid];

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => repositorio.listarTreinos(uid as string),
    enabled: !!uid,
  });

  const alterarCache = (alterar: (atual: TreinoPersonalizado[]) => TreinoPersonalizado[]) => {
    void queryClient.cancelQueries({ queryKey: chave });
    queryClient.setQueryData<TreinoPersonalizado[]>(chave, (atual) => alterar(atual ?? []));
  };

  const aoFalhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    toast.error(mensagem);
    void queryClient.invalidateQueries({ queryKey: chave });
  };

  const criarTreino = async (dados: TreinoInput): Promise<string> => {
    if (!uid) throw new Error("Não autenticado");
    const { treino, confirmacao } = repositorio.criarTreino(uid, dados);
    alterarCache((atual) => [treino, ...atual]);
    confirmacao.catch(aoFalhar("Não foi possível salvar o treino."));
    return treino.id as string;
  };

  const atualizarTreino = async (id: string, input: TreinoInput): Promise<void> => {
    const { dados, confirmacao } = repositorio.atualizarTreino(id, input);
    alterarCache((atual) => atual.map((t) => (t.id === id ? { ...t, ...dados } : t)));
    confirmacao.catch(aoFalhar("Não foi possível atualizar o treino."));
  };

  const deletarTreino = async (id: string): Promise<void> => {
    alterarCache((atual) => atual.filter((t) => t.id !== id));
    repositorio.excluirTreino(id).catch(aoFalhar("Não foi possível excluir o treino."));
  };

  return {
    treinos: consulta.data ?? VAZIO,
    loading: consulta.isLoading,
    erro: consulta.isError,
    criarTreino,
    atualizarTreino,
    deletarTreino,
    recarregar: () => consulta.refetch(),
  };
}
