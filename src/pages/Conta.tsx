import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Download, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { montarExportacaoCompleta } from "@/data/repositories/contaRepository";
import { mensagemErroAuth } from "@/domain/errosAuth";
import { historicoEmCsv, relatorioPorExercicioEmCsv } from "@/domain/exportacao";
import { chaveDiaLocal } from "@/domain/datas";
import { LIMITES_GRATUITO } from "@/domain/planos";
import { useAuth } from "@/hooks/useAuth";
import { usePlano } from "@/hooks/usePlano";
import { useSessoes } from "@/hooks/useSessoes";
import { baixarArquivo } from "@/lib/utils";

const CONFIRMACAO = "EXCLUIR";

const Conta = () => {
  const navigate = useNavigate();
  const { user, excluirConta } = useAuth();
  const { premium, uso } = usePlano();
  const { sessoes } = useSessoes();
  const [exportando, setExportando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [confirmacao, setConfirmacao] = useState("");
  const [senha, setSenha] = useState("");

  const usaSenha = user?.providerData.some((p) => p.providerId === "password") ?? false;
  const hoje = chaveDiaLocal();

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
      <header className="pt-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold">Minha conta</h1>
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
      </header>

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
            onClick={() => baixarArquivo(`historico-${hoje}.csv`, historicoEmCsv(sessoes), "text/csv;charset=utf-8")}
          >
            <Download className="w-4 h-4" />
            Histórico em planilha (CSV)
          </Button>
          <Button variant="outline" className="w-full h-11 gap-1.5" disabled={exportando} onClick={exportarTudo}>
            <Download className="w-4 h-4" />
            {exportando ? "Preparando..." : "Todos os dados (JSON)"}
          </Button>
          {premium ? (
            <Button
              variant="outline"
              className="w-full h-11 gap-1.5"
              onClick={() =>
                baixarArquivo(`relatorio-exercicios-${hoje}.csv`, relatorioPorExercicioEmCsv(sessoes), "text/csv;charset=utf-8")
              }
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
