import { useQuery, useQueryClient } from "@tanstack/react-query";
import { relatarErro } from "@/lib/monitoramento";
import { toast } from "@/lib/aviso";
import { excluirSessao, listarSessoes, regravarSessao } from "@/data/repositories/sessoesRepository";
import type { Sessao } from "@/domain/sessao";
import { useAuth } from "./useAuth";

const VAZIO: Sessao[] = [];

export const chaveSessoes = (uid: string | undefined) => ["sessoes", uid];

const maisRecentesPrimeiro = (a: Sessao, b: Sessao) =>
  new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime();

export function useSessoes() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const chave = chaveSessoes(uid);
  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => listarSessoes(uid as string),
    enabled: !!uid,
  });

  const aoFalhar = (mensagem: string) => (erro: unknown) => {
    console.error(mensagem, erro);
    relatarErro(erro, { acao: mensagem });
    toast.error(mensagem);
    void queryClient.invalidateQueries({ queryKey: chave });
  };

  // A tela não espera o servidor: sem sinal, a gravação fica na fila do Firestore.
  // Recordes, gráficos e metas são calculados a partir desta lista e mudam junto.
  const gravar = (sessao: Sessao, mensagemDeErro: string) => {
    if (!uid) return;
    queryClient.setQueryData<Sessao[]>(chave, (atual = []) =>
      [...atual.filter((s) => s.id !== sessao.id), sessao].sort(maisRecentesPrimeiro),
    );
    regravarSessao(uid, sessao).catch(aoFalhar(mensagemDeErro));
  };

  const corrigirSessao = (sessao: Sessao) =>
    gravar({ ...sessao, atualizadaEm: new Date().toISOString() }, "Não foi possível salvar a correção.");

  const restaurarSessao = (sessao: Sessao) => gravar(sessao, "Não foi possível recuperar o treino.");

  const removerSessao = (id: string) => {
    if (!uid) return;
    queryClient.setQueryData<Sessao[]>(chave, (atual = []) => atual.filter((s) => s.id !== id));
    excluirSessao(uid, id).catch(aoFalhar("Não foi possível excluir o treino."));
  };

  return {
    sessoes: consulta.data ?? VAZIO,
    loading: consulta.isLoading,
    erro: consulta.isError,
    recarregar: () => consulta.refetch(),
    corrigirSessao,
    removerSessao,
    restaurarSessao,
  };
}
