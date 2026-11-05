import { Suspense, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Lock, Search, Trophy } from "lucide-react";
import { Cabecalho } from "@/components/Cabecalho";
import { EstadoVazio, TelaCarregando } from "@/components/Estados";
import { ErrorState } from "@/components/ErrorState";
import { GraficoColunas } from "@/components/graficos";
import { Indicador } from "@/components/Indicador";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calendarioDoMes,
  compararPeriodos,
  exerciciosTreinados,
  recordesRecentes,
  resumirSessoes,
  semanasRecentes,
  seriesPorGrupo,
  sequenciaDeSemanas,
  variacaoPercentual,
} from "@/domain/estatisticas";
import { formatarDuracao, formatarKg, formatarVolume, normalizarBusca } from "@/domain/texto";
import { RecursoPremium } from "@/components/RecursoPremium";
import { AnaliseTreinos } from "@/components/ia/AnaliseTreinos";
import { iaAtiva } from "@/lib/recursos";
import { SecaoConquistas } from "@/components/SecaoConquistas";
import { SecaoMetas } from "@/components/SecaoMetas";
import { usePlano } from "@/hooks/usePlano";
import { useSessoes } from "@/hooks/useSessoes";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

const ABAS = [
  { id: "resumo", rotulo: "Resumo" },
  { id: "historico", rotulo: "Histórico" },
  { id: "exercicios", rotulo: "Exercícios" },
  { id: "conquistas", rotulo: "Conquistas" },
];

const DIAS_CABECALHO = ["S", "T", "Q", "Q", "S", "S", "D"];
const TAMANHO_PAGINA = 20;

const Evolucao = () => {
  const navigate = useNavigate();
  const { sessoes, loading, erro, recarregar } = useSessoes();
  const { premium } = usePlano();
  // No endereço: voltar de um treino aberto daqui devolve a pessoa à mesma aba.
  const [parametros, setParametros] = useSearchParams();
  const pedida = parametros.get("aba");
  const aba = ABAS.some((a) => a.id === pedida) ? (pedida as string) : "resumo";
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
      recordes: recordesRecentes(sessoes),
      exercicios: exerciciosTreinados(sessoes),
    };
  }, [sessoes]);

  const comparacao = useMemo(() => compararPeriodos(sessoes, dias), [sessoes, dias]);
  const grupos = useMemo(() => seriesPorGrupo(sessoes, dias), [sessoes, dias]);
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
          <Button onClick={() => navigate("/meus-treinos")}>Ver meus treinos</Button>
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
  const maiorGrupo = grupos[0]?.series ?? 0;

  const mudarMes = (delta: number) =>
    setMesVisivel(({ ano, mes }) => {
      const data = new Date(ano, mes + delta, 1);
      return { ano: data.getFullYear(), mes: data.getMonth() };
    });

  return (
    // Largo só aqui: gráficos e listas aproveitam a tela do computador. O treino continua em coluna.
    <div className="min-h-screen p-4 pb-28 max-w-md lg:max-w-4xl mx-auto space-y-4">
      <Cabecalho
        titulo="Evolução"
        subtitulo={`${total.treinos} treino${total.treinos !== 1 ? "s" : ""} registrado${total.treinos !== 1 ? "s" : ""}${
          sequencia > 0
            ? ` · ${sequencia} semana${sequencia !== 1 ? "s" : ""} seguida${sequencia !== 1 ? "s" : ""}`
            : ""
        }`}
      />

      <Tabs value={aba} onValueChange={(valor) => setParametros({ aba: valor }, { replace: true })}>
        <TabsList className="grid h-11 w-full grid-cols-4 lg:max-w-md">
          {ABAS.map((a) => (
            <TabsTrigger key={a.id} value={a.id} className="h-9 min-w-0 px-1 text-caption">
              {a.rotulo}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumo" className="mt-4 space-y-4">
          {iaAtiva &&
            (premium ? (
              <AnaliseTreinos sessoes={sessoes} />
            ) : (
              <RecursoPremium
                titulo="Análise com IA"
                descricao="Uma leitura do que mudou nos seus últimos 30 dias."
              />
            ))}

          {/* Comparação entre períodos */}
          <section aria-label="Comparação entre períodos" className="space-y-3">
            <div role="group" aria-label="Período" className="grid grid-cols-3 gap-1.5 lg:max-w-md">
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Indicador
                rotulo="Treinos"
                valor={String(atual.treinos)}
                variacao={variacaoPercentual(atual.treinos, anterior.treinos)}
              />
              <Indicador
                rotulo="Volume"
                valor={formatarVolume(atual.volumeKg)}
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

          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <section aria-label="Frequência semanal" className="glass-card rounded-xl p-4">
              <h2 className="font-semibold mb-2">Treinos por semana</h2>
              <Suspense fallback={<div className="h-44" />}>
                <GraficoColunas medida="Treinos" dados={frequencia} />
              </Suspense>
            </section>

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

            {premium ? (
              <section aria-label="Séries por grupo muscular" className="glass-card rounded-xl p-4 space-y-3">
                <div>
                  <h2 className="font-semibold">Séries por grupo muscular</h2>
                  <p className="text-caption text-muted-foreground">
                    Últimos {dias} dias, pelo músculo principal de cada exercício.
                  </p>
                </div>
                {grupos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma série neste período.</p>
                ) : (
                  <ul className="space-y-2">
                    {grupos.map((g) => (
                      <li key={g.id} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
                        <span className="truncate">{g.rotulo}</span>
                        <span aria-hidden className="h-2 rounded-full bg-surface-3 overflow-hidden">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${(g.series / maiorGrupo) * 100}%`,
                              backgroundColor: "hsl(var(--grafico))",
                            }}
                          />
                        </span>
                        <span className="text-right font-medium tabular-nums">{g.series}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ) : (
              <RecursoPremium
                titulo="Séries por grupo muscular"
                descricao="Veja se o treino está equilibrado entre os músculos."
              />
            )}

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
                        {new Date(r.data).toLocaleDateString("pt-BR")} · antes {r.anterior}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium">{r.valor}</span>
                  </div>
                ))}
              </section>
            )}
          </div>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {/* Calendário */}
            <section aria-label="Calendário" className="glass-card rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold flex-1 first-letter:uppercase">{nomeMes}</h2>
                <Button variant="ghost" size="icon" aria-label="Mês anterior" onClick={() => mudarMes(-1)}>
                  <ChevronLeft />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Próximo mês"
                  disabled={noMesAtual}
                  onClick={() => mudarMes(1)}
                >
                  <ChevronRight />
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

            {/* Histórico */}
            <section aria-label="Histórico" className="space-y-2">
              <h2 className="font-semibold">Treinos finalizados</h2>
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
                  className="w-full"
                  onClick={() => setLimiteHistorico((n) => n + TAMANHO_PAGINA)}
                >
                  Ver mais
                </Button>
              )}
            </section>
          </div>
        </TabsContent>

        <TabsContent value="exercicios" className="mt-4">
          <section aria-label="Por exercício" className="space-y-2 lg:max-w-2xl">
            <h2 className="font-semibold">Por exercício</h2>
            {exercicios.length > 8 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  aria-label="Buscar exercício treinado"
                  placeholder="Buscar exercício..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9 bg-surface-2"
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
        </TabsContent>

        <TabsContent value="conquistas" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            {premium ? (
              <SecaoMetas sessoes={sessoes} />
            ) : (
              <RecursoPremium
                titulo="Metas personalizadas"
                descricao="Acompanhe uma carga, um volume ou uma quantidade de treinos."
              />
            )}
            <SecaoConquistas sessoes={sessoes} premium={premium} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Evolucao;
