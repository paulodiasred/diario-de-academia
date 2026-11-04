import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { criarMeta, excluirMeta, listarMetas } from "@/data/repositories/metasRepository";
import type { Meta } from "@/domain/metas";
import { useAuth } from "./useAuth";

const VAZIO: Meta[] = [];

export function useMetas() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chave = ["metas", uid];

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => listarMetas(uid as string),
    enabled: !!uid,
  });

  const aoFalhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    toast.error(mensagem);
    void queryClient.invalidateQueries({ queryKey: chave });
  };

  return {
    metas: consulta.data ?? VAZIO,
    adicionar: (dados: Omit<Meta, "id">) => {
      if (!uid) return;
      const { meta, confirmacao } = criarMeta(uid, dados);
      queryClient.setQueryData<Meta[]>(chave, (atual = []) => [...atual, meta]);
      confirmacao.catch(aoFalhar("Não foi possível salvar a meta."));
    },
    remover: (id: string) => {
      if (!uid) return;
      queryClient.setQueryData<Meta[]>(chave, (atual = []) => atual.filter((m) => m.id !== id));
      excluirMeta(uid, id).catch(aoFalhar("Não foi possível excluir a meta."));
    },
  };
}
