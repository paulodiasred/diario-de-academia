import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/aviso";
import { SessaoAtivaContext } from "@/contexts/SessaoAtivaContext";
import {
  escolherRascunho,
  esquecerRascunhoLocal,
  guardarRascunho,
  lerRascunhoLocal,
} from "@/data/repositories/rascunhoSessao";
import {
  apagarRascunhoRemoto,
  gravarSessaoFinalizada,
  lerRascunhoRemoto,
  listarSessoes,
  novoIdDeSessao,
  sessaoJaFinalizada,
} from "@/data/repositories/sessoesRepository";
import {
  alternarSerie as alternarSerieNaSessao,
  criarSessao,
  finalizarSessao,
  type ErroSerie,
  type Sessao,
} from "@/domain/sessao";
import { useAuth } from "@/hooks/useAuth";
import { relatarErro } from "@/lib/monitoramento";
import { chaveSessoes } from "@/hooks/useSessoes";
import type { TreinoPersonalizado } from "@/types/catalogo";

export function SessaoAtivaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  // Fonte da verdade síncrona: dois toques seguidos nunca partem de um estado velho.
  const atual = useRef<Sessao | null>(null);

  const definir = useCallback((nova: Sessao | null) => {
    atual.current = nova;
    setSessao(nova);
  }, []);

  // Recuperação: o aparelho responde na hora; a nuvem confirma depois.
  useEffect(() => {
    if (!uid) {
      definir(null);
      setCarregando(false);
      return;
    }

    let cancelado = false;
    const local = lerRascunhoLocal(uid);
    definir(local);
    setCarregando(!local);

    (async () => {
      let remoto: Sessao | null = null;
      try {
        remoto = await lerRascunhoRemoto(uid);
      } catch (erro) {
        console.warn("Sem acesso ao rascunho na nuvem; usando o do aparelho:", erro);
      }
      if (cancelado) return;

      const escolhido = escolherRascunho(atual.current, remoto);
      let jaFinalizada = false;
      if (escolhido) {
        try {
          jaFinalizada = await sessaoJaFinalizada(uid, escolhido.id);
        } catch {
          // Sem conexão, é melhor recuperar do que arriscar perder o treino.
        }
      }
      if (cancelado) return;

      if (jaFinalizada) {
        // Finalizada em outro aparelho: este rascunho é só uma sobra.
        esquecerRascunhoLocal(uid);
        apagarRascunhoRemoto(uid).catch(() => undefined);
        definir(null);
      } else {
        definir(escolherRascunho(atual.current, escolhido));
      }
      setCarregando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [uid, definir]);

  const alterar = useCallback<
    (alteracao: (s: Sessao) => Sessao, opcoes?: { imediato?: boolean }) => void
  >(
    (alteracao, opcoes) => {
      if (!uid || !atual.current) return;
      const nova = { ...alteracao(atual.current), atualizadaEm: new Date().toISOString() };
      definir(nova);
      guardarRascunho(uid, nova, opcoes?.imediato ?? true);
    },
    [uid, definir],
  );

  const iniciar = useCallback(
    async (treino: Pick<TreinoPersonalizado, "id" | "nome" | "exercicios">) => {
      if (!uid) throw new Error("Não autenticado");
      const anteriores = await queryClient
        .fetchQuery({
          queryKey: chaveSessoes(uid),
          queryFn: () => listarSessoes(uid),
          staleTime: 5 * 60 * 1000,
        })
        .catch(() => [] as Sessao[]);
      const nova = criarSessao(novoIdDeSessao(uid), treino, anteriores);
      definir(nova);
      guardarRascunho(uid, nova, true);
    },
    [uid, queryClient, definir],
  );

  const alternarSerie = useCallback(
    (exercicio: number, serie: number): ErroSerie => {
      if (!atual.current) return null;
      const { sessao: nova, erro } = alternarSerieNaSessao(atual.current, exercicio, serie);
      if (!erro) alterar(() => nova);
      return erro;
    },
    [alterar],
  );

  const finalizar = useCallback((): string | null => {
    const emAndamento = atual.current;
    if (!uid || !emAndamento) return null;
    const final = finalizarSessao(emAndamento);

    queryClient.setQueryData<Sessao[]>(chaveSessoes(uid), (lista = []) => [final, ...lista]);
    esquecerRascunhoLocal(uid);
    definir(null);

    gravarSessaoFinalizada(uid, final).catch((erro) => {
      // O servidor recusou: devolve o treino em andamento para nada se perder.
      console.error("Erro ao finalizar o treino:", erro);
      relatarErro(erro, { acao: "finalizar treino" });
      queryClient.setQueryData<Sessao[]>(chaveSessoes(uid), (lista = []) =>
        lista.filter((s) => s.id !== final.id),
      );
      definir(emAndamento);
      guardarRascunho(uid, emAndamento, false);
      toast.error("Não foi possível salvar o treino. Ele continua em andamento.");
    });
    return final.id;
  }, [uid, queryClient, definir]);

  const descartar = useCallback(() => {
    if (!uid) return;
    esquecerRascunhoLocal(uid);
    definir(null);
    apagarRascunhoRemoto(uid).catch((erro) => {
      console.error("Erro ao descartar o treino:", erro);
    });
  }, [uid, definir]);

  const valor = useMemo(
    () => ({ sessao, carregando, iniciar, alterar, alternarSerie, finalizar, descartar }),
    [sessao, carregando, iniciar, alterar, alternarSerie, finalizar, descartar],
  );

  return <SessaoAtivaContext.Provider value={valor}>{children}</SessaoAtivaContext.Provider>;
}
