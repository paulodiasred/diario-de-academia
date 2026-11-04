import { Suspense, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, Search, Trophy } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio, TelaCarregando } from "@/components/Estados";
import { ErrorState } from "@/components/ErrorState";
import { GraficoColunas } from "@/components/graficos";
import { Indicador } from "@/components/Indicador";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calendarioDoMes,
  compararPeriodos,
  exerciciosTreinados,
  recordesBatidos,
  resumirSessoes,
  semanasRecentes,
  sequenciaDeSemanas,
  variacaoPercentual,
} from "@/domain/estatisticas";
import { formatarDuracao, formatarKg, normalizarBusca } from "@/domain/texto";
import { RecursoPremium } from "@/components/RecursoPremium";
import { SecaoConquistas } from "@/components/SecaoConquistas";
import { SecaoMetas } from "@/components/SecaoMetas";
import { usePlano } from "@/hooks/usePlano";
import { useSessoes } from "@/hooks/useSessoes";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

const DIAS_CABECALHO = ["S", "T", "Q", "Q", "S", "S", "D"];
const TAMANHO_PAGINA = 20;

const Evolucao = () => {
  const navigate = useNavigate();
  const { sessoes, loading, erro, recarregar } = useSessoes();
  const { premium } = usePlano();
  const [dias, setDias] = useState(7);
  const [mesVisivel, setMesVisivel] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  });
  const [limiteHistorico, setLimiteHistorico] = useState(TAMANHO_PAGINA);
  const [busca, setBusca] = useState("");

  const dados = useMemo(() => {
    const finalizadas = sessoes.filter((s) => s.finalizadaEm);
    const semanas = semanasRecentes(sessoes);
    return {
      finalizadas,
      total: resumirSessoes(finalizadas),
      sequencia: sequenciaDeSemanas(sessoes),
      frequencia: semanas.map((s) => ({ rotulo: s.rotulo, valor: s.treinos })),
      volume: semanas.map((s) => ({ rotulo: s.rotulo, valor: s.volumeKg })),
      recordes: recordesBatidos(sessoes),
      exercicios: exerciciosTreinados(sessoes),
    };
  }, [sessoes]);

  const comparacao = useMemo(() => compararPeriodos(sessoes, dias), [sessoes, dias]);
  const calendario = useMemo(
    () => calendarioDoMes(sessoes, mesVisivel.ano, mesVisivel.mes),
    [sessoes, mesVisivel],
  );

  if (erro) {
    return (
      <ErrorState
        mensagem="Não foi possível carregar sua evolução"
        onTentarNovamente={() => void recarregar()}
      />
    );
  }

  if (loading) return <TelaCarregando />;

  if (dados.finalizadas.length === 0) {
    return (
      <div className="min-h-screen p-4 pb-28 max-w-md mx-auto space-y-5">
        <Cabecalho titulo="Evolução" />
        <EstadoVazio
          titulo="Sua evolução começa no primeiro treino"
          descricao="Finalize um treino para ver histórico, recordes e gráficos aqui."
        >
          <Button className="h-11" onClick={() => navigate("/meus-treinos")}>
            Ver meus treinos
          </Button>
        </EstadoVazio>
      </div>
    );
  }

  const { atual, anterior } = comparacao;
  const { total, sequencia, frequencia, volume, recordes, exercicios, finalizadas } = dados;
  const hoje = new Date();
  const nomeMes = new Date(mesVisivel.ano, mesVisivel.mes, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  const noMesAtual =
    mesVisivel.ano === hoje.getFullYear() && mesVisivel.mes === hoje.getMonth();
  const treinosNoMes = calendario.flat().filter((d) => d.doMes).flatMap((d) => d.sessoes).length;
  const exerciciosVisiveis = busca
    ? exercicios.filter((e) => normalizarBusca(e.nome).includes(normalizarBusca(busca)))
    : exercicios.slice(0, 8);

  const mudarMes = (delta: number) =>
    setMesVisivel(({ ano, mes }) => {
      const data = new Date(ano, mes + delta, 1);
      return { ano: data.getFullYear(), mes: data.getMonth() };
    });

  return (
    <div className="min-h-screen p-4 pb-28 max-w-md mx-auto space-y-5">
      <Cabecalho
        titulo="Evolução"
        subtitulo={`${total.treinos} treino${total.treinos !== 1 ? "s" : ""} registrado${total.treinos !== 1 ? "s" : ""}${
          sequencia > 0
            ? ` · ${sequencia} semana${sequencia !== 1 ? "s" : ""} seguida${sequencia !== 1 ? "s" : ""}`
            : ""
        }`}
      />

      {/* Comparação entre períodos */}
      <section aria-label="Comparação entre períodos" className="space-y-3">
        <div role="group" aria-label="Período" className="grid grid-cols-3 gap-1.5">
          {PERIODOS.map((p) => {
            const liberado = premium || p.dias === 7;
            return (
            <button
              key={p.dias}
              type="button"
              aria-pressed={dias === p.dias}
              onClick={() => (liberado ? setDias(p.dias) : navigate("/planos"))}
              className={`h-11 rounded-lg text-sm font-medium transition-colors ${
                dias === p.dias
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-3 text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                {!liberado && <Lock className="w-3 h-3" aria-label="Premium" />}
                {p.rotulo}
              </span>
            </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Indicador
            rotulo="Treinos"
            valor={String(atual.treinos)}
            variacao={variacaoPercentual(atual.treinos, anterior.treinos)}
          />
          <Indicador
            rotulo="Volume"
            valor={formatarKg(atual.volumeKg)}
            variacao={variacaoPercentual(atual.volumeKg, anterior.volumeKg)}
          />
          <Indicador
            rotulo="Séries"
            valor={String(atual.series)}
            variacao={variacaoPercentual(atual.series, anterior.series)}
          />
          <Indicador
            rotulo="Tempo"
            valor={formatarDuracao(atual.tempoSeg)}
            variacao={variacaoPercentual(atual.tempoSeg, anterior.tempoSeg)}
          />
        </div>

        {(atual.seriesSemReps > 0 || atual.sessoesSemTempo > 0) && (
          <p className="text-caption text-muted-foreground">
            Registros antigos não têm repetições nem duração.
            {atual.seriesSemReps > 0 &&
              ` ${atual.seriesSemReps} série${atual.seriesSemReps !== 1 ? "s" : ""} fora do volume.`}
            {atual.sessoesSemTempo > 0 &&
              ` ${atual.sessoesSemTempo} treino${atual.sessoesSemTempo !== 1 ? "s" : ""} fora do tempo.`}
          </p>
        )}
      </section>

      <section aria-label="Frequência semanal" className="glass-card rounded-xl p-4">
        <h2 className="font-semibold mb-2">Treinos por semana</h2>
        <Suspense fallback={<div className="h-44" />}>
          <GraficoColunas medida="Treinos" dados={frequencia} />
        </Suspense>
      </section>

      {premium ? (
        <section aria-label="Volume semanal" className="glass-card rounded-xl p-4">
        <h2 className="font-semibold mb-2">Volume por semana</h2>
        <Suspense fallback={<div className="h-44" />}>
          <GraficoColunas
            medida="Volume"
            unidade="kg"
            dados={volume}
            vazio="O volume aparece quando você registra carga e repetições."
          />
        </Suspense>
      </section>
      ) : (
        <RecursoPremium titulo="Volume por semana" descricao="Veja a evolução do seu volume aqui na Evolução." />
      )}

      {/* Calendário */}
      <section aria-label="Calendário" className="glass-card rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold flex-1 first-letter:uppercase">{nomeMes}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Mês anterior"
            onClick={() => mudarMes(-1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11"
            aria-label="Próximo mês"
            disabled={noMesAtual}
            onClick={() => mudarMes(1)}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-caption text-muted-foreground" aria-hidden>
          {DIAS_CABECALHO.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendario.flat().map((dia) => {
            const treinou = dia.sessoes.length > 0;
            const descricao = `${dia.data.toLocaleDateString("pt-BR")}: ${
              treinou ? dia.sessoes.map((s) => s.nome).join(", ") : "sem treino"
            }`;
            if (!dia.doMes) return <span key={dia.chave} aria-hidden />;
            return treinou ? (
              <button
                key={dia.chave}
                type="button"
                aria-label={descricao}
                onClick={() =>
                  navigate(`/treino/resumo/${dia.sessoes[0].id}`, { state: { deHistorico: true } })
                }
                className="aspect-square rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                {dia.data.getDate()}
              </button>
            ) : (
              <span
                key={dia.chave}
                role="img"
                aria-label={descricao}
                className="aspect-square rounded-lg flex items-center justify-center text-sm text-muted-foreground"
              >
                {dia.data.getDate()}
              </span>
            );
          })}
        </div>
        <p className="text-caption text-muted-foreground">
          {treinosNoMes} treino{treinosNoMes !== 1 ? "s" : ""} neste mês
        </p>
      </section>

      {recordes.length > 0 && (
        <section aria-label="Recordes" className="glass-card rounded-xl p-4 space-y-2">
          <h2 className="font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-warning" aria-hidden />
            Recordes recentes
          </h2>
          {recordes.slice(0, 5).map((r) => (
            <div key={`${r.nome}-${r.data}`} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate">{r.nome}</span>
                <span className="block text-caption text-muted-foreground">
                  {new Date(r.data).toLocaleDateString("pt-BR")} · antes {formatarKg(r.anterior)}
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatarKg(r.peso)}</span>
            </div>
          ))}
        </section>
      )}

      {premium ? (
        <SecaoMetas sessoes={sessoes} />
      ) : (
        <RecursoPremium titulo="Metas personalizadas" descricao="Acompanhe uma carga, um volume ou uma quantidade de treinos." />
      )}

      <SecaoConquistas sessoes={sessoes} premium={premium} />

      {/* Por exercício */}
      <section aria-label="Por exercício" className="space-y-2">
        <h2 className="font-semibold">Por exercício</h2>
        {exercicios.length > 8 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              aria-label="Buscar exercício treinado"
              placeholder="Buscar exercício..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 h-11 bg-surface-2"
            />
          </div>
        )}
        <ul className="glass-card rounded-xl divide-y divide-border/60">
          {exerciciosVisiveis.map((e) => (
            <li key={e.nome}>
              <button
                type="button"
                onClick={() => navigate(`/evolucao/exercicio/${encodeURIComponent(e.nome)}`)}
                className="w-full min-h-11 p-3 flex items-center gap-3 text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium truncate">{e.nome}</span>
                  <span className="block text-caption text-muted-foreground">
                    {e.vezes} vez{e.vezes !== 1 ? "es" : ""}
                    {e.melhorPeso !== null && ` · melhor carga ${formatarKg(e.melhorPeso)}`}
                  </span>
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
              </button>
            </li>
          ))}
          {exerciciosVisiveis.length === 0 && (
            <li className="p-4 text-sm text-center text-muted-foreground">
              Nenhum exercício encontrado.
            </li>
          )}
        </ul>
      </section>

      {/* Histórico */}
      <section aria-label="Histórico" className="space-y-2">
        <h2 className="font-semibold">Histórico</h2>
        <ul className="glass-card rounded-xl divide-y divide-border/60">
          {finalizadas.slice(0, limiteHistorico).map((s) => {
            const resumo = resumirSessoes([s]);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/treino/resumo/${s.id}`, { state: { deHistorico: true } })}
                  className="w-full min-h-11 p-3 flex items-center gap-3 text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium truncate">{s.nome}</span>
                    <span className="block text-caption text-muted-foreground">
                      {new Date(s.iniciadaEm).toLocaleDateString("pt-BR")} · {resumo.series} série
                      {resumo.series !== 1 ? "s" : ""}
                      {resumo.volumeKg > 0 && ` · ${formatarKg(resumo.volumeKg)}`}
                    </span>
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        {finalizadas.length > limiteHistorico && (
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => setLimiteHistorico((n) => n + TAMANHO_PAGINA)}
          >
            Ver mais
          </Button>
        )}
      </section>
    </div>
  );
};

export default Evolucao;
