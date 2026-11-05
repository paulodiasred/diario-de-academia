import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apagarAnalise,
  lerAnalise,
  lerAnalisesUsadas,
  pedirAnalise,
} from "@/data/repositories/analiseRepository";
import { COTA_MENSAL_DE_ANALISES } from "@/domain/analiseTreinos";
import { toast } from "@/lib/aviso";
import { mensagemDaFuncao } from "@/lib/funcoes";
import { relatarErro } from "@/lib/monitoramento";
import { useAuth } from "./useAuth";

const FALHA_GENERICA = "Não foi possível gerar a análise. Verifique a internet e tente de novo.";

export function useAnaliseIA() {
  const { user } = useAuth();
  const uid = user?.uid as string;
  const queryClient = useQueryClient();
  const chaveAnalise = ["analise-ia", uid];
  const chaveUso = ["analise-ia-uso", uid];

  const analise = useQuery({ queryKey: chaveAnalise, queryFn: () => lerAnalise(uid), enabled: !!uid });
  const usadas = useQuery({ queryKey: chaveUso, queryFn: () => lerAnalisesUsadas(uid), enabled: !!uid });

  const atualizar = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: chaveAnalise }),
      queryClient.invalidateQueries({ queryKey: chaveUso }),
    ]);

  const gerar = useMutation({
    mutationFn: pedirAnalise,
    onSuccess: atualizar,
    onError: (erro) => {
      relatarErro(erro, { acao: "gerar análise" });
      toast.error(mensagemDaFuncao(erro, FALHA_GENERICA));
      void atualizar();
    },
  });

  const apagar = useMutation({
    mutationFn: () => apagarAnalise(uid),
    onSuccess: () => {
      queryClient.setQueryData(chaveAnalise, null);
      toast.success("Análise apagada.");
    },
    onError: (erro) => {
      relatarErro(erro, { acao: "apagar análise" });
      toast.error("Não foi possível apagar a análise.");
    },
  });

  return {
    analise: analise.data ?? null,
    carregando: analise.isLoading || usadas.isLoading,
    restantes: Math.max(0, COTA_MENSAL_DE_ANALISES - (usadas.data ?? 0)),
    gerando: gerar.isPending,
    gerar: () => gerar.mutate(),
    apagando: apagar.isPending,
    apagar: () => apagar.mutate(),
  };
}
