import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Minus,
  StickyNote,
  LineChart,
  Plus,
  Trash2,
} from "lucide-react";
import { TelaCarregando } from "@/components/Estados";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GraficoLinha, preCarregarGraficos } from "@/components/graficos";
import { ImagemExercicio } from "@/components/ImagemExercicio";
import { DescansoBar } from "@/components/treino/DescansoBar";
import { CabecalhoSeries, LinhaSerie } from "@/components/treino/LinhaSerie";
import {
  adicionarSerie,
  anotarExercicio,
  atualizarSerie,
  contarSeriesPendentes,
  descreverSerie,
  historicoDoExercicio,
  irParaExercicio,
  pontosEvolucao,
  removerSerie,
  temSerieConcluida,
  ultimaExecucao,
  type Descanso,
} from "@/domain/sessao";
import { useSessaoAtiva } from "@/hooks/useSessaoAtiva";
import { useSessoes } from "@/hooks/useSessoes";
import { slug } from "@/domain/texto";
import { usePerfil } from "@/hooks/usePerfil";
import { MEDIDA_LABEL, MUSCULO_LABEL } from "@/types/catalogo";

// Traz o catálogo inteiro: só é baixado depois que a tela de treino já abriu.
const ComoFazerSheet = lazy(() => import("@/components/treino/ComoFazerSheet"));

function Cronometro({ inicio }: { inicio: string }) {
  const [, setTique] = useState(0);
  useEffect(() => {
    const intervalo = setInterval(() => setTique((t) => t + 1), 1000);
    return () => clearInterval(intervalo);
  }, []);
  const total = Math.max(0, Math.floor((Date.now() - new Date(inicio).getTime()) / 1000));
  const horas = Math.floor(total / 3600);
  const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const segundos = String(total % 60).padStart(2, "0");
  return (
    <span className="tabular-nums">
      {horas > 0 ? `${horas}:` : ""}
      {minutos}:{segundos}
    </span>
  );
}

const Treino = () => {
  const navigate = useNavigate();
  const { sessao, carregando, alterar, alternarSerie, finalizar, descartar } = useSessaoAtiva();
  const { sessoes } = useSessoes();
  const { vinculos } = usePerfil();
  const [confirmarFim, setConfirmarFim] = useState(false);
  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const [evolucaoAberta, setEvolucaoAberta] = useState(false);
  const [comoFazerAberto, setComoFazerAberto] = useState(false);
  const [notasAbertas, setNotasAbertas] = useState<number | null>(null);
  const saindo = useRef(false);

  // Baixa agora as telas seguintes: na academia, o sinal pode sumir antes de finalizar.
  useEffect(() => {
    void import("./ResumoTreino");
    void import("./Index");
    void import("./MeusTreinos");
    void preCarregarGraficos();
    void import("@/components/treino/ComoFazerSheet");
  }, []);

  const exercicio = sessao?.exercicios[sessao.exercicioAtual];

  const anterior = useMemo(
    () => (exercicio ? ultimaExecucao(sessoes, exercicio.exercicioId, exercicio.nome) : null),
    [sessoes, exercicio],
  );

  const mudarDescanso = useCallback(
    (descanso: Descanso | null) => alterar((s) => ({ ...s, descanso })),
    [alterar],
  );

  if (carregando) {
    return (
      <TelaCarregando />
    );
  }

  if (!sessao || !exercicio) {
    return saindo.current ? null : <Navigate to="/" replace />;
  }

  const indice = sessao.exercicioAtual;
  const total = sessao.exercicios.length;
  const anteriores = anterior?.series.filter((s) => s.concluida) ?? [];
  const pendentes = contarSeriesPendentes(sessao);
  const algumaFeita = temSerieConcluida(sessao);
  const imagemDoExercicio = exercicio.images?.[0] ?? vinculos[slug(exercicio.nome)]?.imagem;
  const proximaSerie = exercicio.series.findIndex((s) => !s.concluida);
  // Só a última série, e só se ainda não foi feita: nada concluído é removido por engano.
  const ultimaSerie = exercicio.series.length - 1;
  const podeRemoverSerie = ultimaSerie > 0 && !exercicio.series[ultimaSerie].concluida;
  const mostrarNotas = notasAbertas === indice || exercicio.notas.length > 0;

  const aoAlternar = (serie: number) => {
    const erro = alternarSerie(indice, serie);
    if (erro === "peso") toast.error("Confira o peso desta série");
    if (erro === "reps") toast.error("Informe as repetições desta série");
  };

  const concluirTreino = () => {
    saindo.current = true;
    const id = finalizar();
    navigate(`/treino/resumo/${id}`, { replace: true });
  };

  const descartarTreino = () => {
    saindo.current = true;
    descartar();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen p-4 pb-32 max-w-md mx-auto space-y-4">
      {/* Cabeçalho */}
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar ao início" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold truncate">{sessao.nome}</h1>
          <p className="text-sm text-muted-foreground">
            <Cronometro inicio={sessao.iniciadaEm} /> · {pendentes} série
            {pendentes !== 1 ? "s" : ""} pendente{pendentes !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant={pendentes === 0 ? "default" : "secondary"}
          className="h-11"
          onClick={() => (algumaFeita ? setConfirmarFim(true) : setConfirmarDescarte(true))}
        >
          Finalizar
        </Button>
      </header>

      {/* Navegação entre exercícios */}
      {total > 1 && (
      <nav aria-label="Exercícios do treino" className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Exercício anterior"
          disabled={indice === 0}
          onClick={() => alterar((s) => irParaExercicio(s, indice - 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-1 min-w-0 gap-1.5 overflow-x-auto py-1">
          {sessao.exercicios.map((e, i) => {
            const completo = e.series.every((s) => s.concluida);
            return (
              <button
                key={`${e.exercicioId}-${i}`}
                type="button"
                aria-label={`Ir para ${e.nome}`}
                aria-current={i === indice ? "step" : undefined}
                onClick={() => alterar((s) => irParaExercicio(s, i))}
                className={`h-9 min-w-9 shrink-0 rounded-lg text-sm font-semibold ${
                  i === indice
                    ? "bg-foreground text-background"
                    : completo
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary/60 text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-label="Próximo exercício"
          disabled={indice === total - 1}
          onClick={() => alterar((s) => irParaExercicio(s, indice + 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </nav>
      )}

      {/* Exercício atual */}
      <section className="glass-card rounded-xl p-3 space-y-3">
        <div className="flex items-start gap-3 px-1">
          <ImagemExercicio caminho={imagemDoExercicio} alt="" className="w-14 h-14 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-muted-foreground">
              Exercício {indice + 1} de {total}
            </p>
            <h2 className="text-lg font-bold leading-tight">{exercicio.nome}</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">
              {[MUSCULO_LABEL[exercicio.primaryMuscles[0]], MEDIDA_LABEL[exercicio.medida]]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" className="h-11 gap-1.5 px-2" onClick={() => setComoFazerAberto(true)}>
            <CircleHelp className="w-4 h-4" />
            Como fazer
          </Button>
          <Button
            variant="ghost"
            className="h-11 gap-1.5 px-2"
            aria-label="Ver evolução do exercício"
            onClick={() => setEvolucaoAberta(true)}
          >
            <LineChart className="w-4 h-4" />
            Evolução
          </Button>
        </div>

        {exercicio.circuito && (
          <ul className="px-2 list-disc list-inside text-sm text-muted-foreground">
            {exercicio.circuito.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}

        <div className="space-y-1">
          <CabecalhoSeries medida={exercicio.medida} />
          {exercicio.series.map((serie, i) => (
            <LinhaSerie
              key={i}
              numero={i + 1}
              serie={serie}
              medida={exercicio.medida}
              anterior={anteriores[i]}
              proxima={i === proximaSerie}
              onMudar={(campos) =>
                alterar((s) => atualizarSerie(s, indice, i, campos), { imediato: false })
              }
              onAlternar={() => aoAlternar(i)}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-11 gap-1.5"
            onClick={() => alterar((s) => adicionarSerie(s, indice))}
          >
            <Plus className="w-4 h-4" />
            Adicionar série
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            aria-label="Remover última série"
            disabled={!podeRemoverSerie}
            onClick={() => alterar((s) => removerSerie(s, indice, ultimaSerie))}
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {mostrarNotas ? (
          <Textarea
            aria-label={`Observações de ${exercicio.nome}`}
            placeholder="Observações deste exercício"
            value={exercicio.notas}
            rows={2}
            maxLength={1000}
            className="bg-secondary/30 resize-none text-sm"
            onChange={(e) => {
              const notas = e.target.value;
              alterar((s) => anotarExercicio(s, indice, notas), { imediato: false });
            }}
          />
        ) : (
          <Button
            variant="ghost"
            className="w-full h-11 gap-1.5 text-muted-foreground"
            onClick={() => setNotasAbertas(indice)}
          >
            <StickyNote className="w-4 h-4" />
            Adicionar observação
          </Button>
        )}
      </section>

      <Button
        variant="ghost"
        className="w-full h-11 gap-1.5 text-destructive"
        onClick={() => setConfirmarDescarte(true)}
      >
        <Trash2 className="w-4 h-4" />
        Descartar treino
      </Button>

      {sessao.descanso && <DescansoBar descanso={sessao.descanso} onMudar={mudarDescanso} />}

      {comoFazerAberto && (
        <Suspense fallback={null}>
          <ComoFazerSheet
            exercicioId={exercicio.exercicioId}
            nome={exercicio.nome}
            aberto
            onFechar={() => setComoFazerAberto(false)}
          />
        </Suspense>
      )}

      {/* Evolução do exercício */}
      <Sheet open={evolucaoAberta} onOpenChange={setEvolucaoAberta}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="text-left">{exercicio.nome}</SheetTitle>
          </SheetHeader>
          {evolucaoAberta && (
            <div className="space-y-4 pt-3">
              <Suspense fallback={<div className="h-48" />}>
                <GraficoLinha
                  medida="Maior carga"
                  unidade="kg"
                  dados={pontosEvolucao(sessoes, exercicio.exercicioId, exercicio.nome).map((p) => ({
                    rotulo: p.data,
                    valor: p.peso,
                  }))}
                />
              </Suspense>
              <div className="space-y-2">
                {historicoDoExercicio(sessoes, exercicio.exercicioId, exercicio.nome).map((item) => (
                  <div key={item.sessaoId} className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-sm font-semibold">
                      {new Date(item.data).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.series.map((s) => descreverSerie(s, exercicio.medida)).join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmarFim} onOpenChange={setConfirmarFim}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendentes > 0
                ? `${pendentes} série${pendentes !== 1 ? "s" : ""} não concluída${pendentes !== 1 ? "s" : ""} não entra${pendentes !== 1 ? "m" : ""} no histórico.`
                : "Todas as séries foram concluídas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar ao treino</AlertDialogCancel>
            <AlertDialogAction onClick={concluirTreino}>Finalizar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmarDescarte} onOpenChange={setConfirmarDescarte}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              {algumaFeita
                ? "As séries deste treino não entrarão no histórico. Esta ação não pode ser desfeita."
                : "Nenhuma série foi concluída, então não há nada para salvar."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar ao treino</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={descartarTreino}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Treino;
