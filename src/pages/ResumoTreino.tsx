import { useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Pencil, Share2, Trash2, Trophy } from "lucide-react";
import { toast } from "@/lib/aviso";
import { textoParaCompartilhar } from "@/domain/exportacao";
import { TelaCarregando } from "@/components/Estados";
import { CorrigirTreinoSheet } from "@/components/treino/CorrigirTreinoSheet";
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
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ErrorState";
import { descreverSerie, resumirSessao } from "@/domain/sessao";
import { Indicador } from "@/components/Indicador";
import { formatarDuracao, formatarKg } from "@/domain/texto";
import { useSessoes } from "@/hooks/useSessoes";

const ResumoTreino = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const deHistorico = (useLocation().state as { deHistorico?: boolean } | null)?.deHistorico;
  const { sessoes, loading, erro, recarregar, corrigirSessao, removerSessao, restaurarSessao } = useSessoes();
  const [corrigindo, setCorrigindo] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const saindo = useRef(false);

  const sessao = sessoes.find((s) => s.id === id);
  const resumo = useMemo(
    () => (sessao ? resumirSessao(sessao, sessoes) : null),
    [sessao, sessoes],
  );

  if (erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar o resumo"
        onTentarNovamente={() => void recarregar()}
      />
    );
  }

  if (loading) {
    return (
      <TelaCarregando />
    );
  }

  if (!sessao || !resumo) return saindo.current ? null : <Navigate to="/" replace />;

  const sair = () => (deHistorico ? navigate(-1) : navigate("/", { replace: true }));

  const excluir = () => {
    const excluida = sessao;
    // Antes de tirar da lista: sem o treino, esta tela mandaria para o início.
    saindo.current = true;
    sair();
    removerSessao(excluida.id);
    toast.success("Treino excluído", {
      duration: 6000,
      action: { label: "Desfazer", onClick: () => restaurarSessao(excluida) },
    });
  };

  const compartilhar = async () => {
    const texto = textoParaCompartilhar(sessao, resumo);
    try {
      if (navigator.share) {
        await navigator.share({ text: texto });
      } else {
        await navigator.clipboard.writeText(texto);
        toast.success("Resumo copiado");
      }
    } catch (erro) {
      // Fechar a janela de compartilhar não é um erro.
      if ((erro as Error).name !== "AbortError") toast.error("Não foi possível compartilhar.");
    }
  };

  return (
    <div className="min-h-screen p-4 pb-8 max-w-md mx-auto space-y-4">
      <header className="pt-4">
        <p className="text-sm text-muted-foreground">
          {deHistorico
            ? new Date(sessao.iniciadaEm).toLocaleDateString("pt-BR")
            : "Treino concluído"}
        </p>
        <h1 className="text-2xl font-bold">{sessao.nome}</h1>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {resumo.duracaoSeg !== null && (
          <Indicador rotulo="Duração" valor={formatarDuracao(resumo.duracaoSeg)} />
        )}
        <Indicador rotulo="Séries" valor={String(resumo.series)} />
        <Indicador rotulo="Exercícios" valor={String(resumo.exercicios)} />
        <Indicador rotulo="Volume" valor={formatarKg(resumo.volumeKg)} />
      </div>

      {resumo.seriesSemReps > 0 && (
        <p className="text-sm text-muted-foreground">
          {resumo.seriesSemReps} série{resumo.seriesSemReps !== 1 ? "s" : ""} sem repetições
          registradas fora do volume.
        </p>
      )}

      {resumo.recordes.length > 0 && (
        <section className="glass-card rounded-xl p-4 space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" />
            Novos recordes de carga
          </h2>
          {resumo.recordes.map((r) => (
            <p key={r.nome} className="text-sm">
              {r.nome}: <strong>{formatarKg(r.peso)}</strong>{" "}
              <span className="text-muted-foreground">(antes {formatarKg(r.anterior)})</span>
            </p>
          ))}
        </section>
      )}

      <section className="glass-card rounded-xl p-4 space-y-3">
        {sessao.exercicios.map((e) => (
          <div key={e.exercicioId}>
            <h2 className="font-semibold text-sm">{e.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {e.series.map((s) => descreverSerie(s, e.medida)).join(" · ")}
            </p>
            {e.notas && <p className="text-sm italic text-muted-foreground mt-1">{e.notas}</p>}
          </div>
        ))}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11 gap-1.5" onClick={() => setCorrigindo(true)}>
          <Pencil className="w-4 h-4" />
          Corrigir
        </Button>
        <Button variant="outline" className="h-11 gap-1.5" onClick={compartilhar}>
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      </div>

      <Button className="w-full h-12" onClick={sair}>
        {deHistorico ? "Voltar" : "Concluir"}
      </Button>

      <Button
        variant="ghost"
        className="w-full h-11 gap-1.5 text-destructive"
        onClick={() => setConfirmarExclusao(true)}
      >
        <Trash2 className="w-4 h-4" />
        Excluir treino
      </Button>

      <CorrigirTreinoSheet
        sessao={sessao}
        aberto={corrigindo}
        onFechar={() => setCorrigindo(false)}
        onSalvar={(corrigida) => {
          corrigirSessao(corrigida);
          setCorrigindo(false);
          toast.success("Treino corrigido");
        }}
      />

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Ele sai do histórico, e recordes, gráficos e metas são recalculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={excluir}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResumoTreino;
