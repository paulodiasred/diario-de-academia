import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Download, Lock, LogOut, Trash2 } from "lucide-react";
import { toast } from "@/lib/aviso";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cabecalho } from "@/components/Cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { montarExportacaoCompleta } from "@/data/repositories/contaRepository";
import { mensagemErroAuth } from "@/domain/errosAuth";
import { historicoEmCsv, relatorioPorExercicioEmCsv } from "@/domain/exportacao";
import { chaveDiaLocal } from "@/domain/datas";
import { LIMITES_GRATUITO } from "@/domain/planos";
import type { Sessao } from "@/domain/sessao";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import { useSessoes } from "@/hooks/useSessoes";
import { baixarArquivo } from "@/lib/utils";

const CONFIRMACAO = "EXCLUIR";

const Conta = () => {
  const navigate = useNavigate();
  const { user, logout, excluirConta, reenviarVerificacao } = useAuth();
  const { premium, uso } = usePlano();
  const { sessoes, loading: carregandoHistorico, erro: erroHistorico, recarregar } = useSessoes();
  const { sessao: treinoEmAndamento } = useSessaoAtiva();
  const [exportando, setExportando] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [senha, setSenha] = useState("");

  const usaSenha = user?.providerData.some((p) => p.providerId === "password") ?? false;
  const hoje = chaveDiaLocal();

  /** Nunca entrega arquivo vazio como se fosse o histórico: quem baixa confia nele como cópia. */
  const baixarPlanilha = async (nome: string, gerar: (lista: Sessao[]) => string) => {
    let lista = sessoes;
    if (erroHistorico) {
      const nova = await recarregar();
      if (nova.isError || !nova.data) {
        toast.error("Não foi possível carregar seu histórico. Confira a conexão e tente de novo.");
        return;
      }
      lista = nova.data;
    }
    if (!lista.some((s) => s.finalizadaEm)) {
      toast("Você ainda não tem treinos finalizados para exportar.");
      return;
    }
    baixarArquivo(nome, gerar(lista), "text/csv;charset=utf-8");
  };

  const sair = async () => {
    setSaindo(true);
    try {
      await logout();
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      toast.error(erro instanceof Error ? erro.message : "Não foi possível sair");
      setSaindo(false);
      setConfirmarSaida(false);
    }
  };

  const exportarTudo = async () => {
    if (!user) return;
    setExportando(true);
    try {
      const dados = await montarExportacaoCompleta(user.uid, user.email);
      baixarArquivo(`diario-de-academia-${hoje}.json`, JSON.stringify(dados, null, 2), "application/json");
    } catch (erro) {
      console.error("Erro ao exportar:", erro);
      toast.error("Não foi possível exportar agora. Tente de novo.");
    } finally {
      setExportando(false);
    }
  };

  const confirmarExclusao = async () => {
    setExcluindo(true);
    try {
      await excluirConta(usaSenha ? senha : undefined);
    } catch (erro) {
      console.error("Erro ao excluir a conta:", erro);
      toast.error(mensagemErroAuth(erro));
      setExcluindo(false);
    }
  };

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-5">
      <Cabecalho titulo="Minha conta" subtitulo={user?.email ?? undefined} onVoltar={() => navigate("/")} />

      {usaSenha && !user?.emailVerified && (
        <section aria-label="Confirmar email" className="glass-card rounded-xl p-4 space-y-2">
          <p className="text-sm">
            Confirme seu email pelo link que enviamos. Isso ajuda a recuperar a conta se você esquecer a senha.
          </p>
          <Button
            variant="outline"
            className="h-11"
            onClick={() =>
              reenviarVerificacao()
                .then(() => toast.success("Email enviado"))
                .catch((erro) => toast.error(mensagemErroAuth(erro)))
            }
          >
            Reenviar email
          </Button>
        </section>
      )}

      <section aria-label="Plano" className="space-y-2">
        <h2 className="font-semibold">Plano</h2>
        <button
          type="button"
          onClick={() => navigate("/planos")}
          className="w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left"
        >
          <span className="flex-1 min-w-0">
            <span className="block font-medium">{premium ? "Premium" : "Gratuito"}</span>
            {!premium && (
              <span className="block text-sm text-muted-foreground">
                {uso.treinos} de {LIMITES_GRATUITO.treinos} treinos · {uso.exercicios} de{" "}
                {LIMITES_GRATUITO.exercicios} exercícios próprios
              </span>
            )}
          </span>
          <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden />
        </button>
      </section>

      <section aria-label="Seus dados" className="space-y-2">
        <h2 className="font-semibold">Seus dados</h2>
        <p className="text-sm text-muted-foreground">Os dados são seus. Baixe uma cópia quando quiser.</p>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-11 gap-1.5"
            disabled={carregandoHistorico}
            onClick={() => void baixarPlanilha(`historico-${hoje}.csv`, historicoEmCsv)}
          >
            <Download className="w-4 h-4" />
            {carregandoHistorico ? "Carregando histórico..." : "Histórico em planilha (CSV)"}
          </Button>
          <Button variant="outline" className="w-full h-11 gap-1.5" disabled={exportando} onClick={exportarTudo}>
            <Download className="w-4 h-4" />
            {exportando ? "Preparando..." : "Todos os dados (JSON)"}
          </Button>
          {premium ? (
            <Button
              variant="outline"
              className="w-full h-11 gap-1.5"
              disabled={carregandoHistorico}
              onClick={() => void baixarPlanilha(`relatorio-exercicios-${hoje}.csv`, relatorioPorExercicioEmCsv)}
            >
              <Download className="w-4 h-4" />
              Relatório por exercício (CSV)
            </Button>
          ) : (
            <Button variant="outline" className="w-full h-11 gap-1.5 text-muted-foreground" onClick={() => navigate("/planos")}>
              <Lock className="w-4 h-4" />
              Relatório por exercício (Premium)
            </Button>
          )}
        </div>
      </section>

      <Button variant="outline" className="w-full h-11 gap-1.5" onClick={() => setConfirmarSaida(true)}>
        <LogOut className="w-4 h-4" />
        Sair da conta
      </Button>

      <section aria-label="Excluir conta" className="space-y-2">
        <h2 className="font-semibold">Excluir conta</h2>
        <p className="text-sm text-muted-foreground">
          Apaga treinos, histórico e exercícios próprios, sem como recuperar. Baixe seus dados antes.
        </p>
        <Button
          variant="outline"
          className="w-full h-11 gap-1.5 text-destructive"
          onClick={() => setDialogoAberto(true)}
        >
          <Trash2 className="w-4 h-4" />
          Excluir minha conta
        </Button>
      </section>

      <nav aria-label="Documentos" className="flex gap-4 text-sm">
        <a className="underline py-3" href="/termos">
          Termos de uso
        </a>
        <a className="underline py-3" href="/privacidade">
          Política de privacidade
        </a>
      </nav>

      <AlertDialog open={confirmarSaida} onOpenChange={setConfirmarSaida}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da conta?</AlertDialogTitle>
            <AlertDialogDescription>
              {treinoEmAndamento
                ? `Seus dados ficam salvos, e "${treinoEmAndamento.nome}" continua em andamento quando você entrar de novo. Depois de sair, o app precisa de internet para abrir.`
                : "Seus dados ficam salvos na conta. Depois de sair, o app precisa de internet para abrir."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saindo}>Cancelar</AlertDialogCancel>
            {/* Button comum: se ainda houver séries sem sincronizar, o aviso aparece antes de fechar. */}
            <Button disabled={saindo} onClick={() => void sair()}>
              {saindo ? "Saindo..." : "Sair"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir a conta para sempre?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso não pode ser desfeito. Digite {CONFIRMACAO} para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Input
              aria-label={`Digite ${CONFIRMACAO} para confirmar`}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
            {usaSenha && (
              <Input
                type="password"
                autoComplete="current-password"
                aria-label="Sua senha"
                placeholder="Sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            {/* Button comum: o diálogo não pode fechar antes de a exclusão terminar ou falhar. */}
            <Button
              variant="destructive"
              disabled={confirmacao !== CONFIRMACAO || (usaSenha && !senha) || excluindo}
              onClick={confirmarExclusao}
            >
              {excluindo ? "Excluindo..." : "Excluir para sempre"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Conta;
