import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TreinoRegistro } from "@/data/treino";
import {
  criarRegistro,
  excluirRegistro,
  listarRegistros,
} from "@/data/repositories/registrosRepository";
import { ultimoPeso } from "@/domain/registros";
import type { RegistroInput } from "@/domain/schemas";
import { useAuth } from "./useAuth";

const VAZIO: TreinoRegistro[] = [];

export function useTreinoStorage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chave = ["registros", uid];

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => listarRegistros(uid as string),
    enabled: !!uid,
  });
  const registros = consulta.data ?? VAZIO;

  const alterarCache = (alterar: (atual: TreinoRegistro[]) => TreinoRegistro[]) => {
    void queryClient.cancelQueries({ queryKey: chave });
    queryClient.setQueryData<TreinoRegistro[]>(chave, (atual) => alterar(atual ?? []));
  };

  /** Atualiza a tela na hora. A gravação segue em segundo plano, mesmo sem sinal. */
  const salvarRegistro = async (input: RegistroInput): Promise<TreinoRegistro> => {
    if (!uid) throw new Error("Usuário não autenticado");
    const { registro, confirmacao } = criarRegistro(uid, input);
    alterarCache((atual) => [registro, ...atual]);
    confirmacao.catch((erro) => {
      console.error("Erro ao salvar registro:", erro);
      alterarCache((atual) => atual.filter((r) => r.id !== registro.id));
      toast.error("Não foi possível salvar a série. Tente de novo.");
    });
    return registro;
  };

  const removerRegistro = async (registro: TreinoRegistro): Promise<void> => {
    if (!registro.id) return;
    alterarCache((atual) => atual.filter((r) => r.id !== registro.id));
    excluirRegistro(registro.id).catch((erro) => {
      console.error("Erro ao excluir registro:", erro);
      alterarCache((atual) => [registro, ...atual]);
      toast.error("Não foi possível desmarcar a série. Tente de novo.");
    });
  };

  return {
    registros,
    loading: consulta.isLoading,
    erro: consulta.isError,
    salvarRegistro,
    removerRegistro,
    getRegistrosPorExercicio: (exercicio: string) =>
      registros.filter((r) => r.exercicio === exercicio),
    getUltimoPeso: (exercicio: string) => ultimoPeso(registros, exercicio),
    recarregar: () => consulta.refetch(),
  };
}
